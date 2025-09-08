import fitz  # PyMuPDF
import os, json, re
from typing import List, Dict

CHUNK_DIR = "data/chunks"
os.makedirs(CHUNK_DIR, exist_ok=True)

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract all text from a PDF file."""
    doc = fitz.open(pdf_path)
    texts = []
    for page in doc:
        text = page.get_text("text")
        # Normalize whitespace
        clean_text = re.sub(r"\s+", " ", text).strip()
        if clean_text:
            texts.append(clean_text)
    doc.close()
    return "\n".join(texts)

def chunk_text(text: str, max_chars: int = 1000) -> List[str]:
    """
    Split text into chunks of ~max_chars length.
    Later we'll refine by token count, but this works for now.
    """
    chunks = []
    current = []
    length = 0

    for sentence in re.split(r'(?<=[.!?]) +', text):  # split by sentences
        if length + len(sentence) > max_chars and current:
            chunks.append(" ".join(current))
            current = []
            length = 0
        current.append(sentence)
        length += len(sentence)

    if current:
        chunks.append(" ".join(current))

    return chunks

def process_pdf(pdf_id: str, pdf_path: str) -> Dict:
    """Extract, chunk, and save PDF text chunks to JSON."""
    text = extract_text_from_pdf(pdf_path)
    chunks = chunk_text(text, max_chars=1000)

    output_path = os.path.join(CHUNK_DIR, f"{pdf_id}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({"pdf_id": pdf_id, "chunks": chunks}, f, ensure_ascii=False, indent=2)

    return {"pdf_id": pdf_id, "num_chunks": len(chunks), "output": output_path}
