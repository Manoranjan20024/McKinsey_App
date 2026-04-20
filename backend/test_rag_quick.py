import os
import asyncio
from dotenv import load_dotenv
from services.rag_handler import get_rag_handler

load_dotenv()

async def test_rag():
    print('Testing RAG Handler...')
    print()

    # Pre-check for env
    if not os.getenv("GEMINI_API_KEY"):
        print("ERROR: GEMINI_API_KEY not found in .env file.")
        return

    rag = get_rag_handler()
 
    # Test 1: Retrieve only (no LLM)
    print('TEST 1: Retrieve mandatory fields for Medical Bill')
    try:
        result = rag.retrieve(
            query='What are the mandatory fields for a medical bill?',
            collection_name='document_checklists'
        )
        print(f'Chunks retrieved: {len(result.retrieved_chunks)}')
        if result.retrieved_chunks:
            print(f'Top similarity:   {result.similarity_scores[0]:.1%}')
            print(f'Top chunk:        {result.retrieved_chunks[0][:150]}...')
    except Exception as e:
        print(f"Error Test 1: {e}")
    print()
 
    # Test 2: Query with LLM answer
    print('TEST 2: LLM answer — provider verification')
    try:
        result2 = rag.query_with_llm(
            question='Is Apollo Hospitals an approved provider?',
            collection_name='provider_directory'
        )
        print(f'Answer: {result2.answer}')
    except Exception as e:
        print(f"Error Test 2: {e}")
    print()
 
    # Test 4: Direct Query (No retrieval)
    print('TEST 4: Direct Query - Literal extraction from context')
    try:
        context = "Invoice #12345. Patient: John Doe. Hospital: City Clinic."
        question = "Who is the patient?"
        answer = await rag.direct_query(context, question)
        print(f'Answer: {answer}')
        
        print('TEST 5: Direct Query - Strict Negative Constraint')
        question2 = "What is the Policy ID?"
        answer2 = await rag.direct_query(context, question2)
        print(f'Answer (expecting NOT_FOUND): {answer2}')
    except Exception as e:
        print(f"Error Test 4/5: {e}")
 
    print()
    print('=== ALL TESTS COMPLETE ===')

if __name__ == '__main__':
    asyncio.run(test_rag())
