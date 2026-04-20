# backend/rag_setup/seed_chromadb.py
 
import os
import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader, DirectoryLoader
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from dotenv import load_dotenv

load_dotenv()
 
# ── CONFIG ───────────────────────────────────────────────
# Adjusted paths for Windows and current directory structure
KNOWLEDGE_BASE_DIR = os.path.join(os.path.dirname(__file__), 'knowledge_base')
CHROMA_DB_PATH     = os.path.join(os.path.dirname(__file__), 'chroma_db')
EMBED_MODEL        = 'models/gemini-embedding-2-preview'
CHUNK_SIZE         = 400
CHUNK_OVERLAP      = 80
 
# ── COLLECTIONS TO CREATE ─────────────────────────────────
COLLECTIONS = {
    'document_checklists':  'checklists',
    'provider_directory':   'providers',
    'policy_rules':         'policies',
    'compliance_standards': 'compliance',
}
 
# ── EMBEDDING MODEL ───────────────────────────────────────
# Google Native Embeddings
embeddings = GoogleGenerativeAIEmbeddings(
    model=EMBED_MODEL,
    google_api_key=os.getenv("GEMINI_API_KEY")
)
 
# ── TEXT SPLITTER ─────────────────────────────────────────
# Split by rule boundaries first, then by size
splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    separators=['\n\nSECTION', '\n\nRule', '\n\n', '\n', ' ']
)
 
def seed_collection(collection_name, folder_name):
    folder_path = os.path.join(KNOWLEDGE_BASE_DIR, folder_name)
    print(f'\nIndexing {collection_name} from {folder_path}...')
 
    if not os.path.exists(folder_path):
        print(f"  Warning: Folder {folder_path} does not exist. Skipping.")
        return 0

    # Load all .txt files from the folder
    loader = DirectoryLoader(folder_path, glob='**/*.txt', loader_cls=TextLoader)
    documents = loader.load()
    print(f'  Loaded {len(documents)} documents')
 
    # Split into chunks
    chunks = splitter.split_documents(documents)
    print(f'  Split into {len(chunks)} chunks')
 
    # Add metadata to each chunk
    for chunk in chunks:
        chunk.metadata['collection'] = collection_name
        chunk.metadata['source_file'] = os.path.basename(chunk.metadata.get('source', ''))
 
    # Create Chroma vector store for this collection
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=collection_name,
        persist_directory=CHROMA_DB_PATH,
    )
 
    print(f'  Successfully indexed {len(chunks)} chunks into "{collection_name}"')
    return len(chunks)
 
if __name__ == '__main__':
    print('Starting RAG Knowledge Base Seeding...')
    print(f'Embedding model: {EMBED_MODEL}')
    print(f'ChromaDB path:   {CHROMA_DB_PATH}')
    print(f'Chunk size:      {CHUNK_SIZE} tokens')
    print(f'Chunk overlap:   {CHUNK_OVERLAP} tokens')
 
    total = 0
    for collection_name, folder_name in COLLECTIONS.items():
        total += seed_collection(collection_name, folder_name)
 
    print(f'\n=== SEEDING COMPLETE ===')
    print(f'Total chunks indexed: {total}')
    print(f'ChromaDB stored at:   {CHROMA_DB_PATH}')
    print('You can now run the application.')
