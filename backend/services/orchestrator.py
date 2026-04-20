# backend/services/orchestrator.py
 
import asyncio
from typing import List
from services.quality_engine import (
    DocumentObject, CheckResult,
    check_clarity, check_completeness, check_name_match, 
    check_date_validity, check_provider, check_signature, 
    check_duplicate, check_language
)
 
async def run_all_checks(document_text: str, doc_type: str) -> List[CheckResult]:
    # Form the document object
    doc = DocumentObject(text=document_text, type=doc_type)

    # Run all 8 checks concurrently
    results = await asyncio.gather(
        check_clarity(doc),
        check_completeness(doc),
        check_name_match(doc),
        check_date_validity(doc),
        check_provider(doc),
        check_signature(doc),
        check_duplicate(doc),
        check_language(doc),
    )
    return results
