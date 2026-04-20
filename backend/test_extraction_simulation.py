import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from services.document_extractor import _safe_parse
from services.orchestrator import run_all_checks
from services.quality_engine import DocumentObject, check_name_match, check_date_validity

async def simulate_extraction():
    print("--- Starting Extraction Simulation ---")
    
    # Mock document text that would have been extracted by Gemini Vision
    mock_doc_text = """
    Patient Name: John Doe
    Hospital/Clinic Name: City Clinic
    Claim ID: CLM-TEST-1001
    Policy Number: POL-009988
    Total Amount: 1500.50
    Date of Service: 2026-04-10
    """
    
    print(f"\nDocument Context:\n{mock_doc_text}\n")
    
    # Running specific checks that were failing previously due to JSON parsing
    print("Running 'check_name_match'...")
    doc = DocumentObject(text=mock_doc_text, type="Medical Bill")
    name_result = await check_name_match(doc)
    print(f"Result -> Status: {name_result.status}, Message: {name_result.message}")
    assert name_result.status == "PASS"

    print("\nRunning 'check_date_validity'...")
    date_result = await check_date_validity(doc)
    print(f"Result -> Status: {date_result.status}, Message: {date_result.message}")
    assert date_result.status == "PASS"

    print("\nSimulation PASSED! Both Quality Engine mappings correctly parsed the RAG LLM JSON response.")

if __name__ == "__main__":
    if not os.getenv("GEMINI_API_KEY"):
        print("ERROR: GEMINI_API_KEY not found in environment. Please set it.")
    else:
        asyncio.run(simulate_extraction())
