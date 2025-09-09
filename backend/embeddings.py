import json
import os
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

# Configure directories
INDEX_DIR = "data/indexes"
os.makedirs(INDEX_DIR, exist_ok=True)

# Initialize the model
try:
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Error loading model: {str(e)}")
    embedding_model = None

def build_faiss_index(pdf_id: str):
    # Load chunks from Step 2
    chunks_path = os.path.join("data/chunks", f"{pdf_id}.json")
    if not os.path.exists(chunks_path):
        raise FileNotFoundError(f"No chunks found for {pdf_id}")
    
    try:
        with open(chunks_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        if "chunks" not in data:
            raise ValueError("Invalid chunks file format")
        
        chunks = data["chunks"]
        if not chunks:
            raise ValueError("No chunks found in the file")
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON file format")

    # Generate embeddings
    embeddings = embedding_model.encode(chunks, convert_to_numpy=True, show_progress_bar=True)
    
    # Build FAISS index (L2 similarity)
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)
    
    # Save index
    index_path = os.path.join(INDEX_DIR, f"{pdf_id}.index")
    faiss.write_index(index, index_path)

    return {
        "pdf_id": pdf_id,
        "num_chunks": len(chunks),
        "index_path": index_path
    }
