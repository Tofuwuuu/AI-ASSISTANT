from fastapi import FastAPI, UploadFile, HTTPException, Body, File
from fastapi.middleware.cors import CORSMiddleware
import uuid
import shutil
import os
import logging
from typing import List
from pdf_processor import process_pdf
from embeddings import build_faiss_index
from query import query_pdf

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI(title="PDF Processing API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],  # React Vite ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up FastAPI application")

# Configure upload directory
UPLOAD_DIR = "data/pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit

@app.get("/")
async def read_root():
    return {"message": "Welcome to FastAPI Backend"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(description="PDF file to upload")):
    """
    Upload and process a PDF file
    """
    logger.debug("Received upload request")
    
    if not file:
        logger.error("No file received in request")
        raise HTTPException(status_code=422, detail="No file received in the request")
        
    logger.debug(f"File received: {file.filename}")
    logger.debug(f"Content type: {file.content_type}")
        
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        logger.error(f"Invalid file type: {file.filename}")
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Check file size
    file.file.seek(0, 2)  # Seek to end of file
    file_size = file.file.tell()
    file.file.seek(0)  # Reset file position
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    try:
        pdf_id = str(uuid.uuid4())
        path = os.path.join(UPLOAD_DIR, f"{pdf_id}.pdf")
        
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process the PDF
        try:
            process_result = process_pdf(pdf_id, path)
            return {
                "pdf_id": pdf_id,
                "status": "processed",
                "filename": file.filename,
                "num_chunks": process_result["num_chunks"]
            }
        except Exception as e:
            # If processing fails, we still keep the uploaded file
            return {
                "pdf_id": pdf_id,
                "status": "uploaded",
                "filename": file.filename,
                "warning": "File uploaded but processing failed"
            }
    
    except Exception as e:
        # Clean up any partially written file
        if os.path.exists(path):
            os.remove(path)
        raise HTTPException(status_code=500, detail="Failed to upload file")

@app.post("/index/{pdf_id}")
async def create_index(pdf_id: str):
    """Create FAISS index for a processed PDF"""
    try:
        result = build_faiss_index(pdf_id)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create index: {str(e)}")

@app.post("/query")
async def ask_question(payload: dict = Body(...)):
    """Query a PDF with a question"""
    pdf_id = payload.get("pdf_id")
    question = payload.get("question")

    if not pdf_id or not question:
        raise HTTPException(status_code=400, detail="Missing pdf_id or question")

    try:
        result = query_pdf(pdf_id, question)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")
