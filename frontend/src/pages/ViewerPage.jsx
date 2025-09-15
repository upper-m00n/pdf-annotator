import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { getHighlights, createHighlight } from '../api/highlights';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

export default function ViewerPage() {
  const { pdfId } = useParams();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [highlights, setHighlights] = useState([]);
  const [pdfContainerRef, setPdfContainerRef] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHighlights = async () => {
      if (pdfId) {
        try {
          const fetchedHighlights = await getHighlights(pdfId);
          setHighlights(fetchedHighlights);
        } catch (err) {
          console.error("Failed to fetch highlights:", err);
        }
      }
    };
    fetchHighlights();
  }, [pdfId]);

  const pdfUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/pdfs/${pdfId}/file`;

  const options = useMemo(() => ({
    httpHeaders: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  }), []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setIsLoading(false);
  }

  function onDocumentLoadError() {
    setError('Failed to load the PDF. Please check the file and try again.');
    setIsLoading(false);
  }

  const handleMouseUp = async () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !pdfContainerRef) return;

    const range = selection.getRangeAt(0);
    const containerRect = pdfContainerRef.getBoundingClientRect();
    const rect = range.getBoundingClientRect();

    const position = {
      x1: rect.left - containerRect.left,
      y1: rect.top - containerRect.top,
      width: rect.width,
      height: rect.height,
    };
    
    const content = { text: selection.toString() };

    if (content.text && window.confirm("Add this highlight?")) {
      try {
        const newHighlight = await createHighlight(pdfId, { content, position, pageNumber });
        setHighlights(prev => [...prev, newHighlight]);
      } catch (err) {
        console.error("Failed to save highlight:", err);
        alert("Error saving highlight.");
      }
    }
    selection.removeAllRanges();
  };

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
          <span>Page {pageNumber} of {numPages || '--'}</span>
          <button onClick={goToNextPage} disabled={!numPages || pageNumber >= numPages} className="px-3 py-1 rounded bg-gray-300 disabled:opacity-50">Next</button>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={zoomOut} className="px-3 py-1 rounded bg-gray-300 disabled:opacity-50">Zoom -</button>
          <button onClick={zoomIn} className="px-3 py-1 rounded bg-gray-300 disabled:opacity-50">Zoom +</button>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto">
        <div className="flex justify-center p-4">
          {error && <div className="text-red-500 font-bold p-8">{error}</div>}
          {!error && (
            <div ref={setPdfContainerRef} onMouseUp={handleMouseUp} className="relative shadow-lg">
              <Document
                file={pdfUrl}
                options={options}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={<div>Loading PDF...</div>}
              >
                <Page pageNumber={pageNumber} scale={scale} />
                {highlights
                  .filter(h => h.pageNumber === pageNumber)
                  .map(h => (
                    <div
                      key={h._id}
                      className="absolute bg-yellow-300 bg-opacity-40 pointer-events-none"
                      style={{
                        left: `${h.position.x1}px`,
                        top: `${h.position.y1}px`,
                        width: `${h.position.width}px`,
                        height: `${h.position.height}px`,
                      }}
                    />
                  ))}
              </Document>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


