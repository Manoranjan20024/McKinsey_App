# Scanify AI: Health Insurance Document Quality Check

Scanify AI is a high-precision, "Zero-Hallucination" document processing platform designed for Health Insurance Claim validation. It uses Gemini 2.0 Flash for multi-modal extraction and a RAG (Retrieval-Augmented Generation) engine grounded in ChromaDB to verify documents against internal compliance checklists and policy rules.

## 🚀 Key Features

- **Zero-Hallucination Extraction**: Mandated literal extraction using Gemini 3 Vision API. If data isn't in the document, it returns null—no placeholders.
- **RAG-Grounded Validation**: Automated 8-point quality audit (Clarity, Completeness, Provider Registry, etc.) verified against a dynamic vector knowledge base.
- **Sub-10s Latency**: Parallelized extraction and animation pacing ensure a premium, fast user experience.
- **Human-in-the-Loop**: Flagged compliance exceptions are routed to a senior review queue for auditor final disposition.
- **Premium UI**: Modern, glassmorphic dashboard built with React 19, Tailwind CSS, and Lucide React.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Axios, Lucide Icons.
- **Backend**: FastAPI, LangChain, Google Generative AI (Gemini 2.0 Flash).
- **Vector DB**: ChromaDB for policy & checklist retrieval.
- **Hosting**: Optimized for local or containerized deployment.

## 📦 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- [Gemini API Key](https://aistudio.google.com/)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Add your GEMINI_API_KEY here
```

### 3. Initialize RAG Knowledge Base
```bash
python rag_setup/seed_chromadb.py
```

### 4. Run Backend
```bash
python main.py
```

### 5. Frontend Setup
```bash
# In the root directory
npm install
npm run dev
```

## 🏗️ Project Structure

- `src/`: React frontend source code.
- `src/screens/`: Modularized dashboard screens (Upload, Processing, Report, Review).
- `src/components/`: Reusable premium UI components.
- `backend/`: FastAPI application.
- `backend/services/`: AI Extraction, RAG retrieval, and Check orchestration logic.
- `backend/rag_setup/`: Scripts and documents for initializing the ChromaDB vector store.

## ⚖️ License

[MIT](LICENSE)
