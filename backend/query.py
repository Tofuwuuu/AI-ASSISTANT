import json
import os
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import pipeline
import faiss

# Paths
CHUNK_DIR = "data/chunks"
INDEX_DIR = "data/indexes"

# Initialize models
try:
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    qa_pipeline = pipeline("question-answering", model="deepset/roberta-base-squad2")
except Exception as e:
    print(f"Error loading models: {str(e)}")
    embedding_model = None
    qa_pipeline = None

def load_chunks(pdf_id: str):
    path = os.path.join(CHUNK_DIR, f"{pdf_id}.json")
    if not os.path.exists(path):
        raise FileNotFoundError(f"No chunks found for {pdf_id}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)["chunks"]

def load_index(pdf_id: str):
    path = os.path.join(INDEX_DIR, f"{pdf_id}.index")
    if not os.path.exists(path):
        raise FileNotFoundError(f"No index found for {pdf_id}")
    return faiss.read_index(path)

def query_pdf(pdf_id: str, question: str, top_k: int = 3):
    if not question.strip():
        raise ValueError("Question cannot be empty")
    
    # Load data
    chunks = load_chunks(pdf_id)
    index = load_index(pdf_id)

    # Validate top_k
    top_k = min(max(1, top_k), len(chunks))  # Ensure top_k is between 1 and len(chunks)
    
    try:
        # Embed question
        q_emb = embedding_model.encode([question], convert_to_numpy=True)

        # Search FAISS
        D, I = index.search(q_emb, top_k)  # distances + indices
        
        # Ensure indices are valid
        valid_indices = [i for i in I[0] if 0 <= i < len(chunks)]
        retrieved_chunks = [chunks[i] for i in valid_indices]
        
        if not retrieved_chunks:
            raise ValueError("No relevant chunks found")

        # Join chunks into context
        context = " ".join(retrieved_chunks)

        # Run Q&A model
        result = qa_pipeline(question=question, context=context)

        return {
            "pdf_id": pdf_id,
            "question": question,
            "answer": result["answer"],
            "score": result["score"],
            "sources": retrieved_chunks
        }
    except Exception as e:
        raise Exception(f"Error querying PDF: {str(e)}")

        # Join chunks into context
        context = " ".join(retrieved_chunks)

        # Run Q&A model
        result = qa_pipeline(question=question, context=context)

        return {
            "pdf_id": pdf_id,
            "question": question,
            "answer": result["answer"],
            "score": result["score"],
            "sources": retrieved_chunks
        }
