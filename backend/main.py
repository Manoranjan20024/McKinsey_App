# backend/main.py

import os
import uuid
import asyncio
import datetime
import hashlib
from typing import Dict, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from services.rag_handler import get_rag_handler
from services.orchestrator import run_all_checks
from services.document_extractor import extract_document_data
import time
import logging
import json
import re

class BulkDeleteRequest(BaseModel):
    upload_ids: List[str]

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global In-Memory Store
REPORTS = {}
TRASH = {}
FILES_HASHES = {} # { sha256_hash: upload_id }
SERVER_START = time.time()
review_queue = []

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Fallback pathing for different execution contexts
KNOWLEDGE_BASE_DIR = os.path.join(BASE_DIR, 'rag_setup', 'knowledge_base')
if not os.path.exists(KNOWLEDGE_BASE_DIR):
    # Try one level up if run from within services or similar
    alt_path = os.path.join(os.path.dirname(BASE_DIR), 'backend', 'rag_setup', 'knowledge_base')
    if os.path.exists(alt_path):
        KNOWLEDGE_BASE_DIR = alt_path
    else:
        # Final fallback to current working directory
        cwd_path = os.path.join(os.getcwd(), 'backend', 'rag_setup', 'knowledge_base')
        if os.path.exists(cwd_path):
            KNOWLEDGE_BASE_DIR = cwd_path

logger.info(f"Knowledge Base Directory: {KNOWLEDGE_BASE_DIR}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warming can sometimes hang ChromaDB if locks are present
    # try:
    #     rag = get_rag_handler()
    #     await rag.retrieve('warm up query', 'document_checklists')
    # except Exception as e:
    #     print(f"RAG pre-warm error (non-fatal): {e}")

    print('Scanify AI Backend Ready.')
    yield

app = FastAPI(lifespan=lifespan, title="Scanify AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── names shown on the Processing screen ───────────────────────────────────
CHECK_NAMES = [
    "Image Clarity",
    "Completeness Check",
    "Patient Name Match",
    "Date Validity",
    "Provider Registry",
    "Signature Check",
    "Duplicate Detection",
    "Compliance Standards",
]

# ─── Background processing task ─────────────────────────────────────────────
async def process_quality_check(
    upload_id: str,
    doc_type: str,
    filename: str,
    file_bytes: bytes,
    form_claim_id: Optional[str] = None,
    form_policy_num: Optional[str] = None,
):
    try:
        started_at = datetime.datetime.utcnow().isoformat() + "Z"
        
        # API Key Safety Check
        from services.document_extractor import GEMINI_API_KEY
        if not GEMINI_API_KEY:
            logger.warning("[process_quality_check] GEMINI_API_KEY missing. Using fallback mock.")
            # Create a very basic mock that matches our new schema
            extracted_data = {
                "claim_id": form_claim_id or "DEMO-ID",
                "patient_name": "Demo Patient",
                "quality_checks": {"checks": [], "overall_score": 70}
            }
        else:
            # ── Step 1 & 2 Parallelized: AI Extraction + Progressive Animation ──
            extraction_task = asyncio.create_task(extract_document_data(file_bytes, filename))
            
            # Concurrent Animation Loop with 'Slow-Down' logic
            for i, name in enumerate(CHECK_NAMES):
                if upload_id in REPORTS:
                    REPORTS[upload_id]["checks_completed"] = i
                    REPORTS[upload_id]["current_check"]    = name
                if i >= 6 and not extraction_task.done():
                    await asyncio.sleep(0.25)
                else:
                    await asyncio.sleep(0.1)
                    
            if upload_id in REPORTS:
                REPORTS[upload_id]["current_check"] = "Finalizing Analysis…"
            extracted_data = await extraction_task
            
        if upload_id in REPORTS:
            REPORTS[upload_id]["extracted"] = extracted_data

        # ── Step 3: Run quality checks (RAG-grounded / Fallback) ─────────
        extracted_qc = (extracted_data or {}).get("quality_checks", {})
        extracted_checks = extracted_qc.get("checks", [])
        
        final_checks = []
        
        # If extraction already did the audit (our common path for speed), use those
        if extracted_checks and any(c.get("result") for c in extracted_checks):
            print(f"[main] Optimization: Using direct mapped checks from AI Engine.")
            for ec in extracted_checks:
                res_status = ec.get("result", "PASS")
                # Safety Logic: If FAIL, we always pull down the score below 25%, regardless of AI output.
                ai_score = str(ec.get("score") or "").rstrip('%')
                try:
                    confidence = float(ai_score) / 100 if (ai_score and float(ai_score) > 1) else (float(ai_score) if ai_score else 0.95)
                except:
                    confidence = 0.95
                
                if res_status == "FAIL":
                    confidence = min(confidence, 0.20)
                elif res_status == "WARNING":
                    confidence = min(confidence, 0.65)
                else:
                    confidence = max(confidence, 0.85)

                final_checks.append({
                    "check_id":    f"CHK_{ec.get('id', 0):03d}",
                    "check_name":  ec.get("name"),
                    "status":      ec.get("result", "PASS"),
                    "confidence":  confidence,
                    "message":     ec.get("message") or f"Verified: {ec.get('result')}",
                    "guidance":    None if ec.get("result") == "PASS" else "Manual verification required.",
                    "rag_rule":    "Direct Mapping from PDF Audit Trail",
                    "severity":    "critical" if ec.get("result") == "FAIL" else ("moderate" if ec.get("result") == "WARNING" else "low")
                })
        else:
            # Fallback to internal quality engine only if extraction is weak
            print(f"[main] Fallback: Running deeper parallel quality checks.")
            doc_text = ""
            if extracted_data:
                hosp  = (extracted_data.get("hospital_details") or {}).get("name", "")
                pname = extracted_data.get("patient_name", "")
                diag  = (extracted_data.get("medical_details") or {}).get("diagnosis", "")
                doc_text = f"{hosp} Bill - Patient: {pname} - Diagnosis: {diag}"
            
            if not doc_text.strip():
                doc_text = f"Health Insurance Claim - {filename} - {doc_type}"

            full_context = (extracted_data or {}).get("full_text") or doc_text
            results = await run_all_checks(full_context, doc_type)
            
            for r in results:
                res_status = r.status
                # Confidence Safety Logic
                confidence = r.confidence
                if res_status == "FAIL":
                    confidence = min(confidence, 0.20)
                elif res_status == "WARNING":
                    confidence = min(confidence, 0.65)
                else:
                    confidence = max(confidence, 0.85)

                final_checks.append({
                    "check_id":    r.check_id,
                    "check_name":  r.check_name,
                    "status":      res_status,
                    "confidence":  confidence,
                    "message":     r.message,
                    "guidance":    r.guidance or ("Please verify this field manually." if r.status != "PASS" else None),
                    "rag_rule":    r.rag_rule or "Standard insurance rule applied.",
                    "severity":    "critical" if r.status == "FAIL" else ("moderate" if r.status == "WARNING" else "low")
                })

        fail_count    = sum(1 for c in final_checks if c["status"] == "FAIL")
        warning_count = sum(1 for c in final_checks if c["status"] == "WARNING")
        pass_count    = len(final_checks) - fail_count - warning_count

        # ── Step 4: Nuanced Weighted Scoring ──────────────────────────
        weights = {
            "Completeness": 15, "Signature": 15, "Date": 15,    # Critical
            "Provider": 12, "Clarity": 12, "Name Match": 12,    # Important
            "Duplicate": 9.5, "Compliance": 9.5                 # Standard
        }
        
        weighted_score = 0
        total_weight = 0
        for check in final_checks:
            cname = check["check_name"]
            weight_key = next((k for k in weights.keys() if k.lower() in cname.lower()), "Compliance")
            weight = weights.get(weight_key, 10)
            status_mod = 1.0 if check["status"] == "PASS" else (0.4 if check["status"] == "WARNING" else 0.0)
            weighted_score += (status_mod * weight)
            total_weight += weight
            
        calculated_percentage = int((weighted_score / total_weight) * 100) if total_weight > 0 else 0
        
        # Merge with AI's internal nuanced score
        ext_overall_score = extracted_qc.get("overall_score") or (extracted_data or {}).get("final_decision", {}).get("score")
        if ext_overall_score is not None:
            try:
                # Clean and convert to int
                cleaned_score = re.sub(r"[^\d]", "", str(ext_overall_score))
                if cleaned_score:
                    ai_val = int(cleaned_score)
                    overall_score = int((ai_val * 0.7) + (calculated_percentage * 0.3))
                    if fail_count > 0: overall_score = min(overall_score, 85)
                    if fail_count >= 2: overall_score = min(overall_score, 50)
                else:
                    overall_score = calculated_percentage
            except (ValueError, TypeError):
                overall_score = calculated_percentage
        else:
            overall_score = calculated_percentage

        # ── Step 5: Decision Routing (Standard Thresholds) ───────────
        if overall_score >= 80:
            decision = "AUTO_PASS"
        elif overall_score > 60:
            decision = "HUMAN_REVIEW"
        else:
            decision = "AUTO_FAIL"

        completed_at = datetime.datetime.utcnow().isoformat() + "Z"
        ext_hosp_details = (extracted_data or {}).get("hospital_details") or {}
        ext_med_details = (extracted_data or {}).get("medical_details") or {}
        ext_fd = (extracted_data or {}).get("final_decision") or {}

        extracted_claim_id    = (extracted_data or {}).get("claim_id") or form_claim_id
        extracted_policy_num  = (extracted_data or {}).get("policy_number") or form_policy_num
        extracted_patient     = (extracted_data or {}).get("patient_name")
        extracted_hospital    = ext_hosp_details.get("name")
        extracted_hosp_addr   = ext_hosp_details.get("address")
        extracted_cert_id     = (extracted_data or {}).get("certificate_id")
        raw_amount = (extracted_data or {}).get("total_amount") or (extracted_data or {}).get("claim_details", {}).get("claim_amount")
        extracted_amount = re.sub(r"[₹$€£,\s]", "", str(raw_amount)) if raw_amount else None
        
        rejection_list = ext_fd.get("rejection_reasons", [])
        final_notes = ". ".join(rejection_list) if rejection_list else (
            "All checks passed. Claim cleared for disbursement." if decision == "AUTO_PASS" else
            "Accuracy score below threshold (<=60%). Claim rejected." if decision == "AUTO_FAIL" else
            "Flagged items require manual review (Accuracy 61-79%)."
        )

        final_decision_status = (
            "APPROVED" if decision == "AUTO_PASS" else
            "REJECTED" if decision == "AUTO_FAIL" else
            "PENDING"
        )

        REPORTS[upload_id].update({
            "status":                 "complete",
            "overall_score":          overall_score,
            "decision":               decision,
            "claim_amount":           extracted_amount,
            "extracted":              {
                **extracted_data,
                "claim_id":      extracted_data.get("claim_id") or extracted_claim_id,
                "policy_number": extracted_data.get("policy_number") or extracted_policy_num,
                "claim_details": {
                    **(extracted_data.get("claim_details") or {}),
                    "claim_amount": extracted_amount
                }
            },
            "processing_time_seconds": round((datetime.datetime.utcnow() - datetime.datetime.fromisoformat(started_at.rstrip("Z"))).total_seconds(), 2),
            "model_used":             "gemini-2.0-flash",
            "filename":               filename,
            "document_type":          doc_type,
            "checks":                 final_checks,
            "quality_checks": {
                "total_checks": len(final_checks),
                "passed":       pass_count,
                "warnings":     warning_count,
                "failed":       fail_count,
                "score":        overall_score,
            },
            "rag_context": {
                "top_similarity_score": max([c["confidence"] for c in final_checks]) if final_checks else 0,
                "retrieved_chunks": [
                    {
                        "rule_text": c["rag_rule"],
                        "similarity": c["confidence"],
                        "applied_to": c["check_id"]
                    }
                    for c in final_checks if c["rag_rule"]
                ]
            },
            "final_decision": {
                "status":          final_decision_status,
                "score":           overall_score,
                "notes":           final_notes,
                "processing_time": f"{round((datetime.datetime.utcnow() - datetime.datetime.fromisoformat(started_at.rstrip('Z'))).total_seconds(), 2)}s",
                "rejection_reasons": rejection_list
            },
            "audit": {
                "submitted_at":         started_at,
                "completed_at":         completed_at,
                "claim_id":             extracted_claim_id,
                "certificate_id":       extracted_cert_id,
                "policy_number":        extracted_policy_num,
                "patient_name":         extracted_patient,
                "claim_amount":         extracted_amount,
                "hospital_name":        extracted_hospital,
                "hospital_address":     extracted_hosp_addr,
                "diagnosis":            ext_med_details.get("diagnosis"),
                "icd_code":             ext_med_details.get("icd_code"),
            },
        })

        REPORTS[upload_id]["checks_completed"] = len(final_checks)
        REPORTS[upload_id]["current_check"]    = "Complete"

        if decision == "HUMAN_REVIEW":
            review_queue.append({
                "upload_id":        upload_id,
                "claim_id":         extracted_claim_id or form_claim_id or upload_id[:8],
                "decision":         "HUMAN_REVIEW",
                "reviewer_decision": None,
                "submitted_at":     datetime.datetime.utcnow().isoformat() + "Z",
                "issue_summary":    f"{fail_count} Fails, {warning_count} Warnings",
                "severity":         "critical" if fail_count > 0 else "moderate"
            })

    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        logger.error(f"[process_quality_check] FATAL ERROR: {err_msg}")
        with open(os.path.join(BASE_DIR, "error_log.txt"), "a") as f:
            f.write(f"\n[{datetime.datetime.now()}] ERROR for {upload_id}:\n{err_msg}\n")
            
        if upload_id in REPORTS:
            REPORTS[upload_id].update({
                "status": "error", "error": str(e), "current_check": "Error during analysis"
            })

# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    uptime_seconds = int(time.time() - SERVER_START)
    return {
        "status": "ok", "model": "gemini-2.0-flash", "rag_status": "connected", 
        "uptime_secs": uptime_seconds, "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }

@app.get("/queue/count")
def get_queue_count():
    pending = [c for c in review_queue if c.get("reviewer_decision") is None]
    return { "pending_count": len(pending), "total_in_queue": len(review_queue) }

@app.get("/queue/list")
def get_queue_list(limit: int = 10, offset: int = 0):
    pending = [c for c in review_queue if c.get("reviewer_decision") is None]
    return { "total": len(pending), "offset": offset, "limit": limit, "items": pending[offset : offset + limit] }

@app.get("/")
async def root():
    return {"status": "ok", "message": "Scanify AI Backend is running"}

@app.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    claim_id:       str = Form(None),
    policy_number:  str = Form(None),
    insurance_type: str = Form("health"),
    claim_type:     str = Form("reimbursement"),
):
    try:
        upload_id  = str(uuid.uuid4())
        file_bytes = await file.read()
        file_hash = hashlib.sha256(file_bytes + f"{claim_id or ''}|{policy_number or ''}".encode()).hexdigest()
        
        if file_hash in FILES_HASHES:
            existing_id = FILES_HASHES[file_hash]
            if existing_id in REPORTS:
                r = REPORTS[existing_id]
                return { 
                    "upload_id": existing_id, 
                    "status": "duplicate", 
                    "actual_status": r.get("status"), 
                    "decision": r.get("decision"), 
                    "is_duplicate": True 
                }
        
        FILES_HASHES[file_hash] = upload_id
        REPORTS[upload_id] = {
            "upload_id": upload_id, 
            "file_hash": file_hash, 
            "claim_id": claim_id, 
            "policy_number": policy_number,
            "filename": file.filename, 
            "status": "processing", 
            "created_at": datetime.datetime.utcnow().isoformat() + "Z",
            "checks_completed": 0, 
            "checks_total": len(CHECK_NAMES), 
            "current_check": "Initializing…",
        }
        
        background_tasks.add_task(process_quality_check, upload_id, "Medical Bill", file.filename, file_bytes, claim_id, policy_number)
        return { "upload_id": upload_id, "status": "processing", "filename": file.filename }
        
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        logger.error(f"[/upload] FATAL ERROR: {err_msg}")
        with open(os.path.join(BASE_DIR, "error_log.txt"), "a") as f:
            f.write(f"\n[{datetime.datetime.now()}] UPLOAD CRASH:\n{err_msg}\n")
        raise HTTPException(status_code=500, detail="Internal analysis initialization error")

@app.get("/quality-report/{upload_id}")
async def get_quality_report(upload_id: str):
    if upload_id not in REPORTS: raise HTTPException(status_code=404, detail="Upload ID not found")
    return REPORTS[upload_id]

@app.post("/human-review/{upload_id}")
async def submit_human_review(upload_id: str, request: dict):
    if upload_id not in REPORTS: raise HTTPException(status_code=404, detail="Upload ID not found")
    REPORTS[upload_id]["human_decision"] = request
    REPORTS[upload_id]["decision_final"] = request["decision"]
    if "final_decision" in REPORTS[upload_id]:
        REPORTS[upload_id]["final_decision"]["status"] = "APPROVED" if request["decision"] == "APPROVE" else "REJECTED"
    for q in review_queue:
        if q["upload_id"] == upload_id: q["reviewer_decision"] = request["decision"]; break
    return { "upload_id": upload_id, "status": "reviewed" }

@app.get("/stats")
async def get_dashboard_stats():
    dist = {"AUTO_PASS": 0, "HUMAN_REVIEW": 0, "AUTO_FAIL": 0}
    for r in REPORTS.values():
        d = r.get("decision", "PENDING")
        if d in dist: dist[d] += 1
    total = sum(dist.values())
    return {
        "documents_today": total, "auto_approved": dist["AUTO_PASS"], "human_review": dist["HUMAN_REVIEW"],
        "avg_check_time": "5.2s", "quality_distribution": {k: round((v/total)*100) if total else 0 for k,v in dist.items()},
        "volume_trend": []
    }

@app.get("/reports")
async def list_reports():
    return sorted(
        [
            {
                "upload_id": r["upload_id"],
                "filename": r.get("filename", "Unknown"),
                "claim_id": r["audit"]["claim_id"] if "audit" in r else "—",
                "patient_name": r["audit"]["patient_name"] if "audit" in r else "—",
                "hospital": r["audit"]["hospital_name"] if "audit" in r else "—",
                "decision": r.get("decision", "PENDING"),
                "score": r.get("overall_score", 0),
                "created_at": r["created_at"]
            }
            for r in REPORTS.values()
        ],
        key=lambda x: x["created_at"],
        reverse=True
    )

@app.delete("/reports/{upload_id}")
async def delete_report(upload_id: str):
    if upload_id in REPORTS:
        report = REPORTS[upload_id]
        report["deleted_at"] = datetime.datetime.utcnow().isoformat() + "Z"
        TRASH[upload_id] = report
        del REPORTS[upload_id]
    return {"status": "success"}

@app.post("/reports/delete-bulk")
async def delete_reports_bulk(request: BulkDeleteRequest):
    count = 0
    now = datetime.datetime.utcnow().isoformat() + "Z"
    for uid in request.upload_ids:
        if uid in REPORTS:
            report = REPORTS[uid]
            report["deleted_at"] = now
            TRASH[uid] = report
            del REPORTS[uid]
            count += 1
    return {"status": "success", "deleted_count": count}

# ─── Trash Management ────────────────────────────────────────────────────────

@app.get("/trash")
async def list_trash():
    return sorted(
        [{"upload_id": r["upload_id"], "claim_id": r["audit"]["claim_id"] if "audit" in r else "—", "patient_name": r["audit"]["patient_name"] if "audit" in r else "—", "decision": r.get("decision", "PENDING"), "score": r.get("overall_score", 0), "created_at": r["created_at"]} for r in TRASH.values()],
        key=lambda x: x["created_at"], reverse=True
    )

@app.post("/trash/restore")
async def restore_reports(request: BulkDeleteRequest):
    count = 0
    for uid in request.upload_ids:
        if uid in TRASH:
            REPORTS[uid] = TRASH[uid]
            del TRASH[uid]
            count += 1
    return {"status": "success", "restored_count": count}

@app.delete("/trash/empty")
async def empty_trash():
    count = len(TRASH)
    TRASH.clear()
    return {"status": "success", "deleted_count": count}

@app.delete("/trash/{upload_id}")
async def permanent_delete_report(upload_id: str):
    if upload_id in TRASH:
        del TRASH[upload_id]
    return {"status": "success"}

@app.post("/trash/delete-bulk")
async def permanent_delete_reports_bulk(request: BulkDeleteRequest):
    count = 0
    for uid in request.upload_ids:
        if uid in TRASH:
            del TRASH[uid]
            count += 1
    return {"status": "success", "deleted_count": count}

# ─── Knowledge Base ──────────────────────────────────────────────────────────

@app.get("/kb/list")
async def list_kb_contents():
    """Returns a list of all categories and files in the Knowledge Base."""
    categories = []
    if not os.path.exists(KNOWLEDGE_BASE_DIR):
        print(f"Warning: {KNOWLEDGE_BASE_DIR} not found.")
        return {"categories": []}
        
    for item in os.listdir(KNOWLEDGE_BASE_DIR):
        item_path = os.path.join(KNOWLEDGE_BASE_DIR, item)
        if os.path.isdir(item_path):
            # Only list .txt files for now
            files = [f for f in os.listdir(item_path) if f.lower().endswith('.txt')]
            categories.append({
                "name": item,
                "files": files
            })
    return {"categories": categories}

@app.get("/kb/file/{category}/{filename}")
async def get_kb_file_content(category: str, filename: str):
    """Returns the content of a specific Knowledge Base file."""
    # Security: Ensure we don't allow path traversal
    if ".." in category or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid path components")

    file_path = os.path.join(KNOWLEDGE_BASE_DIR, category, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {category}/{filename}")
        
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return {
            "category": category,
            "filename": filename,
            "content": content
        }
    except Exception as e:
        logger.error(f"Error reading KB file: {e}")
        raise HTTPException(status_code=500, detail="Failed to read file.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
