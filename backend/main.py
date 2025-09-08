from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid
import shutil
import os
from typing import List
from pdf_processor import process_pdf

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure upload directory
UPLOAD_DIR = "data/pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit

@app.get("/")
async def read_root():
    return {"message": "Welcome to FastAPI Backend"}

@app.post("/upload")
async def upload_pdf(file: UploadFile):
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
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
