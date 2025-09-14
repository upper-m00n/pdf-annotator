import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure the worker
// The path can be tricky; this setup works well with Vite.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

export default function ViewerPage() {
  const { pdfId } = useParams();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  // NOTE: This assumes your backend has a route like GET /api/pdfs/:uuid/file to serve the PDF
  // For simplicity, we'll construct a URL, but a dedicated, protected route is better.
  const pdfUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/pdfs/${pdfId}/file`;

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  return (
    <div className="h-screen flex flex-col bg-gray-200">
      <header className="bg-white shadow-md p-2 flex items-center justify-between z-10">
         <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            &larr; Back to Dashboard
         </Link>
        <div className="flex items-center space-x-4">
          <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="px-3 py-1 rounded bg-gray-300 disabled:opacity-50">Prev</button>
          <span>Page {pageNumber} of {numPages}</span>
          <button onClick={goToNextPage} disabled={pageNumber >= numPages} className="px-3 py-1 rounded bg-gray-300 disabled:opacity-50">Next</button>
        </div>
        <div className="flex items-center space-x-2">
           <button onClick={zoomOut} className="px-3 py-1 rounded bg-gray-300">Zoom -</button>
           <button onClick={zoomIn} className="px-3 py-1 rounded bg-gray-300">Zoom +</button>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto">
        <div className="flex justify-center p-4">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            options={{
                // Pass token if your file serving endpoint is protected
                httpHeaders: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            }}
          >
            <Page pageNumber={pageNumber} scale={scale} />
          </Document>
        </div>
      </main>
    </div>
  );
}