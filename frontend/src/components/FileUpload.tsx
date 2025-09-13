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
        <div className="upload-container">
            <div className="upload-content">
                <div className="upload-header">
                    <h2 className="upload-title">Upload Your PDF</h2>
                    <p className="upload-subtitle">Get instant answers from your documents using AI</p>
                </div>

                <div
                    className={`upload-zone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="upload-icon">
                        {uploading ? (
                            <div className="loading-spinner">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                </svg>
                            </div>
                        ) : (
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        )}
                    </div>
                    
                    <div className="upload-text">
                        {uploading ? (
                            <div>
                                <h3>Processing your PDF...</h3>
                                <p>This may take a few moments</p>
                            </div>
                        ) : (
                            <div>
                                <h3>Drag & drop your PDF here</h3>
                                <p>or click to browse files</p>
                            </div>
                        )}
                    </div>

                    <label className="upload-button">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            disabled={uploading}
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                        />
                        <span className="button-content">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <path d="M14 2v6h6"/>
                            </svg>
                            Choose File
                        </span>
                    </label>

                    <div className="upload-info">
                        <p>Maximum file size: 10MB</p>
                        <p>Supported format: PDF only</p>
                    </div>
                </div>

                {error && (
                    <div className="error-message">
                        <div className="error-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                        </div>
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="success-message">
                        <div className="success-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22,4 12,14.01 9,11.01"/>
                            </svg>
                        </div>
                        <div className="success-content">
                            <span className="success-title">Upload successful!</span>
                            <span className="success-filename">{success.filename}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};