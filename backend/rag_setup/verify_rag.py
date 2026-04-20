# backend/rag_setup/verify_rag.py
 
import os
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma
 
# Adjusted paths for Windows and current directory structure
CHROMA_DB_PATH = os.path.join(os.path.dirname(__file__), 'chroma_db')
EMBED_MODEL    = 'all-MiniLM-L6-v2'
 
embeddings = HuggingFaceEmbeddings(
    model_name=EMBED_MODEL,
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)
 
TEST_QUERIES = [
    ('document_checklists',  'What are the mandatory fields for a medical bill?'),
    ('document_checklists',  'What is the image quality requirement for documents?'),
    ('provider_directory',   'Is Apollo Hospitals an approved provider?'),
    ('policy_rules',         'How many days to submit a reimbursement claim?'),
    ('compliance_standards', 'What does IRDAI require for doctor signatures?'),
]
 
def verify_rag():
    print('=== RAG RETRIEVAL VERIFICATION ===')
    
    if not os.path.exists(CHROMA_DB_PATH):
        print(f"Error: ChromaDB path {CHROMA_DB_PATH} not found. Please run seed_chromadb.py first.")
        return

    for collection_name, query in TEST_QUERIES:
        print(f'\nCollection: {collection_name}')
        print(f'Query: {query}')
 
        try:
            vectorstore = Chroma(
                collection_name=collection_name,
                embedding_function=embeddings,
                persist_directory=CHROMA_DB_PATH,
            )
 
            results = vectorstore.similarity_search_with_score(query, k=2)
 
            for doc, score in results:
                # distance to similarity % (rough heuristic)
                similarity = round((1 - score) * 100, 1)   
                print(f'  Score: {similarity}%')
                print(f'  Chunk: {doc.page_content[:120].replace("\n", " ")}...')
        except Exception as e:
            print(f"  Error searching collection '{collection_name}': {e}")
 
    print('\n=== VERIFICATION COMPLETE ===')
    print('If all scores are above 70%, RAG is working correctly.')

if __name__ == '__main__':
    verify_rag()
