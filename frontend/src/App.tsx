import './App.css'
import { useState } from 'react'
import { FileUpload } from './components/FileUpload'
import Chat from './components/Chat'

interface UploadResponse {
  pdf_id: string;
  status: string;
  filename: string;
  num_chunks?: number;
}

function App() {
  const [uploadedPdf, setUploadedPdf] = useState<UploadResponse | null>(null);

  const handleUploadSuccess = (response: UploadResponse) => {
    setUploadedPdf(response);
  };

  const handleNewUpload = () => {
    setUploadedPdf(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <path d="M14 2v6h6"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
                <path d="M10 9H8"/>
              </svg>
            </div>
            <h1 className="logo-text">PDF AI Assistant</h1>
          </div>
          {uploadedPdf && (
            <button className="new-upload-btn" onClick={handleNewUpload}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
              </svg>
              New Upload
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {!uploadedPdf ? (
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        ) : (
          <div className="chat-container">
            <div className="file-info">
              <div className="file-info-content">
                <div className="file-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6"/>
                  </svg>
                </div>
                <div className="file-details">
                  <h3 className="file-name">{uploadedPdf.filename}</h3>
                  <div className="file-status">
                    <span className={`status-badge ${uploadedPdf.status === 'processed' ? 'success' : 'warning'}`}>
                      {uploadedPdf.status === 'processed' ? 'Ready' : 'Processing'}
                    </span>
                    {uploadedPdf.num_chunks && (
                      <span className="chunk-count">{uploadedPdf.num_chunks} chunks</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <Chat pdfId={uploadedPdf.pdf_id} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
