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

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">PDF Chat Assistant</h1>
      
      {!uploadedPdf ? (
        <FileUpload onUploadSuccess={handleUploadSuccess} />
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-100 rounded-lg">
            <p className="font-semibold">Currently loaded: {uploadedPdf.filename}</p>
            <p className="text-sm text-gray-600">Status: {uploadedPdf.status}</p>
            {uploadedPdf.num_chunks && 
              <p className="text-sm text-gray-600">Processed into {uploadedPdf.num_chunks} chunks</p>
            }
          </div>
          <div className="h-[600px] border rounded-lg shadow-sm">
            <Chat pdfId={uploadedPdf.pdf_id} />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
