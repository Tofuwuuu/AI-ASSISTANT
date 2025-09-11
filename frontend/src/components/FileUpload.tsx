import { useState, useRef } from 'react';

interface UploadResponse {
    pdf_id: string;
    status: string;
    filename: string;
    num_chunks?: number;
}

interface FileUploadProps {
    onUploadSuccess: (response: UploadResponse) => void;
}

export const FileUpload = ({ onUploadSuccess }: FileUploadProps) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<UploadResponse | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File) => {
        setError(null);
        setSuccess(null);
        setUploading(true);

        if (!file.type.includes('pdf')) {
            setError('Please select a PDF file');
            setUploading(false);
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            setUploading(false);
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch('http://localhost:8080/upload', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Upload failed');
            }
            const data: UploadResponse = await response.json();
            setSuccess(data);
            onUploadSuccess(data);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleUpload(file);
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="pdf-upload-ui">
            <div className="pdf-content">
                <h1 className="pdf-title">PDF Chat Assistant</h1>
                <div
                    className={`pdf-upload-box${dragActive ? ' drag-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="pdf-upload-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                            <path d="M16 13H8" />
                            <path d="M16 17H8" />
                            <path d="M10 9H8" />
                        </svg>
                    </div>
                    <div className="pdf-upload-text">Drag & drop a PDF, or</div>
                    <label className="pdf-upload-btn">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            disabled={uploading}
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                        />
                        <span>Select a file</span>
                    </label>
                </div>
                {uploading && <div className="pdf-processing">Processing...</div>}
                {error && <div className="pdf-error">{error}</div>}
                {success && (
                    <div className="pdf-success">
                        <p>Successfully uploaded: {success.filename}</p>
                        <p>PDF ID: {success.pdf_id}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
