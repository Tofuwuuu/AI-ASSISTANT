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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset states
        setError(null);
        setSuccess(null);
        setUploading(true);

        // Validate file type
        if (!file.type.includes('pdf')) {
            setError('Please select a PDF file');
            setUploading(false);
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            setUploading(false);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            console.log('Uploading file:', file.name, 'size:', file.size);
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
            
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="upload-container">
            <div className="upload-box">
                <h2>Upload PDF</h2>
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleUpload}
                    disabled={uploading}
                    ref={fileInputRef}
                    className="file-input"
                />
                
                {uploading && <div className="status">Uploading...</div>}
                
                {error && (
                    <div className="error-message">
                        Error: {error}
                    </div>
                )}
                
                {success && (
                    <div className="success-message">
                        <p>Successfully uploaded: {success.filename}</p>
                        <p>PDF ID: {success.pdf_id}</p>
                    </div>
                )}
            </div>
            
            <style>{`
                .upload-container {
                    padding: 20px;
                    display: flex;
                    justify-content: center;
                }
                
                .upload-box {
                    max-width: 500px;
                    width: 100%;
                    padding: 20px;
                    border: 2px dashed #ccc;
                    border-radius: 8px;
                    text-align: center;
                }
                
                .file-input {
                    margin: 20px 0;
                }
                
                .status {
                    color: #666;
                    margin: 10px 0;
                }
                
                .error-message {
                    color: #d32f2f;
                    margin: 10px 0;
                    padding: 10px;
                    background-color: #ffebee;
                    border-radius: 4px;
                }
                
                .success-message {
                    color: #2e7d32;
                    margin: 10px 0;
                    padding: 10px;
                    background-color: #e8f5e9;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
};
