# backend/services/rag_handler.py
 
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from dataclasses import dataclass
from typing import List, Optional
 
load_dotenv()

# Adjusted paths for Windows and current directory structure
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
CHROMA_DB_PATH = os.path.join(BASE_DIR, 'rag_setup', 'chroma_db')
EMBED_MODEL    = 'models/gemini-embedding-2-preview'
GEMINI_MODEL   = "gemini-2.0-flash"   # high-speed flash model
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # set in .env file
TOP_K          = 3          # retrieve top 3 chunks
MIN_SIMILARITY = 0.50       # minimum similarity threshold
 
@dataclass
class RAGResult:
    answer:           str
    retrieved_chunks: List[str]
    similarity_scores: List[float]
    collection_used:  str
    checklist_name:   Optional[str] = None
 
class RAGHandler:
    def __init__(self):
        # Load embedding model (Google Native)
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model=EMBED_MODEL,
            google_api_key=GEMINI_API_KEY
        )
        # Load LLM once at startup
        self.llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GEMINI_API_KEY,
            temperature=0
        )
        self._vectorstores = {}   # cache vectorstores
 
    def _get_vectorstore(self, collection_name: str) -> Chroma:
        if collection_name not in self._vectorstores:
            self._vectorstores[collection_name] = Chroma(
                collection_name=collection_name,
                embedding_function=self.embeddings,
                persist_directory=CHROMA_DB_PATH,
            )
        return self._vectorstores[collection_name]
 
    async def retrieve(self, query: str, collection_name: str) -> RAGResult:
        '''Retrieve relevant chunks for a query from a collection.'''
        vs = self._get_vectorstore(collection_name)
        # Using asimilarity_search_with_score for non-blocking IO
        results = await vs.asimilarity_search_with_score(query, k=TOP_K)
 
        chunks = []
        scores = []
        for doc, distance in results:
            # rough distance to similarity
            similarity = round(1 - distance, 3)
            if similarity >= MIN_SIMILARITY:
                chunks.append(doc.page_content)
                scores.append(similarity)
 
        return RAGResult(
            answer='',
            retrieved_chunks=chunks,
            similarity_scores=scores,
            collection_used=collection_name,
        )
 
    async def direct_query(self, context: str, question_original: str) -> str:
        """Query the LLM directly with the provided context, bypassing retrieval."""
        prompt = PromptTemplate.from_template('''You are a Document Data Extraction Expert. Your task is to extract field values from the provided document text.

STRICT INSTRUCTIONS:
1. USE ONLY the provided "Document Context" to find the following fields: Patient Name, Hospital/Clinic Name, Claim ID, Policy Number, and Total Amount.
2. ZERO HALLUCINATION: If a field is not explicitly present in the text, you must return "NOT_FOUND".
3. NO PLACEHOLDERS: Do not ever return "Ramesh Kumar", "Apollo Hospitals", or any date/ID from training examples unless they are literally in the Document Context.
4. If multiple names exist, choose the one clearly identified as the Patient or Insured.

Document Context:
{context}

Extract the following in JSON format:
{{
  "patient_name": "",
  "hospital_name": "",
  "claim_id": "",
  "policy_number": "",
  "total_amount": ""
}}''')
        
        chain = prompt | self.llm | StrOutputParser()
        return await chain.ainvoke({"context": context})

    async def query_with_llm(self, question: str, collection_name: str) -> RAGResult:
        '''Retrieve chunks AND generate an LLM answer grounded in retrieved context.'''
        vs      = self._get_vectorstore(collection_name)
        retriever = vs.as_retriever(search_kwargs={'k': TOP_K})
 
        prompt = PromptTemplate.from_template('''You are a Document Data Extraction Expert. Your task is to extract field values from the provided document text.

STRICT INSTRUCTIONS:
1. USE ONLY the provided "Document Context" to find the following fields: Patient Name, Hospital/Clinic Name, Claim ID, Policy Number, and Total Amount.
2. ZERO HALLUCINATION: If a field is not explicitly present in the text, you must return "NOT_FOUND".
3. NO PLACEHOLDERS: Do not ever return "Ramesh Kumar", "Apollo Hospitals", or any date/ID from training examples unless they are literally in the Document Context.
4. If multiple names exist, choose the one clearly identified as the Patient or Insured.

Document Context:
{context}

Extract the following in JSON format:
{{
  "patient_name": "",
  "hospital_name": "",
  "claim_id": "",
  "policy_number": "",
  "total_amount": ""
}}''')
 
        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)
 
        rag_chain = (
            {"context": retriever | format_docs}
            | prompt
            | self.llm
            | StrOutputParser()
        )
 
        # Use async methods for both retrieval and generation
        src_docs = await retriever.ainvoke(question)
        answer   = await rag_chain.ainvoke(question)
 
        return RAGResult(
            answer=answer,
            retrieved_chunks=[d.page_content for d in src_docs],
            similarity_scores=[1.0] * len(src_docs),
            collection_used=collection_name,
        )
 
# Singleton — instantiated once at application startup
# We delay instantiation until actually used to avoid errors if env not ready
_rag_handler_instance = None

def get_rag_handler():
    global _rag_handler_instance
    if _rag_handler_instance is None:
        _rag_handler_instance = RAGHandler()
    return _rag_handler_instance
