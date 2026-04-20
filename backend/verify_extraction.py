# backend/verify_extraction.py
# Tests the FINAL high-precision extraction schema merging logic

import json
from main import REPORTS

def test_final_merging_logic():
    upload_id = "test_abc_final"
    REPORTS[upload_id] = {
        "upload_id": upload_id,
        "claim_id": "DEFAULT-001",
        "policy_number": "POL-DEFAULT",
        "insurance_type": "health",
        "claim_type": "reimbursement",
        "filename": "final_test.pdf",
        "status": "processing"
    }
    
    # Mock AI response with the FINAL schema
    extracted_data = {
        "claim_id": "CLM-REAL-123",
        "patient_name": "Extracted Patient", # Should be filtered
        "hospital_details": {
            "name": "Apollo Hospitals", # Should be PRESERVED now (not exact forbidden)
            "address": "Bannerghatta Road, Bangalore"
        }
    }
    
    from services.document_extractor import _filter_placeholders
    filtered = _filter_placeholders(extracted_data)
    
    print(f"--- FINAL Verification ---")
    print(f"Original Patient: {extracted_data['patient_name']}")
    print(f"Filtered Patient: {filtered['patient_name']}")
    print(f"Original Hospital: {extracted_data['hospital_details']['name']}")
    print(f"Filtered Hospital: {filtered['hospital_details']['name']}")
    
    assert filtered['patient_name'] is None, "'Extracted Patient' label should be filtered out!"
    assert filtered['hospital_details']['name'] == "Apollo Hospitals", "Real hospital names should be preserved."
    assert filtered['claim_id'] == "CLM-REAL-123", "Legitimate IDs should be preserved."
    
    print("Test PASSED: Filters are correctly identifying placeholders while preserving real data.")

if __name__ == "__main__":
    test_final_merging_logic()
