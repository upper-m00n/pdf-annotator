import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { getHighlights, createHighlight, updateHighlightNote } from '../api/highlights';
import { getSummary } from '../api/nlp'; // Import the new NLP API function

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

// NoteModal component remains the same...
const NoteModal = ({ highlight, onSave, onCancel }) => {
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (highlight) {
      setNoteText(highlight.note || '');
    }
  }, [highlight]);

  if (!highlight) return null;

  const handleSave = () => {
    onSave(highlight._id, noteText);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Edit Note</h3>
        <blockquote className="text-sm text-gray-600 bg-gray-100 p-3 rounded-md mb-4 border-l-4 border-indigo-300">
          "{highlight?.content?.text || '[No text captured for this highlight]'}"
        </blockquote>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="w-full h-40 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          placeholder="Add your comments or tags here..."
        />
        <div className="mt-5 flex justify-end space-x-3">
          <button onClick={onCancel} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">Save Note</button>
        </div>
      </div>
    </div>
  );
};

// New component for the Summary/NLP modal
const SummaryModal = ({ summaryData, isLoading, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">AI Summary & Key Phrases</h3>
        {isLoading ? (
          <div className="text-center p-8">Loading analysis...</div>
        ) : (
          summaryData && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Summary</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-md mb-4">{summaryData.summary}</p>
              <h4 className="font-semibold text-gray-700 mb-2">Key Phrases</h4>
              <div className="flex flex-wrap gap-2">
                {summaryData.keyPhrases.map((phrase, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                    {phrase}
                  </span>
                ))}
              </div>
            </div>
          )
        )}
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};


export default function ViewerPage() {
  const { pdfId } = useParams();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [highlights, setHighlights] = useState([]);
  const [pdfContainerRef, setPdfContainerRef] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHighlight, setSelectedHighlight] = useState(null);

  // State for the new NLP feature
  const [summaryData, setSummaryData] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

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
  const options = useMemo(() => ({ httpHeaders: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }), []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setIsLoading(false);
  }

  function onDocumentLoadError() {
    setError('Failed to load the PDF. Please check the file and try again.');
    setIsLoading(false);
  }

  const handleMouseUp = async () => {
    // Prevent creating new highlights if a modal is open
    if (selectedHighlight || showSummaryModal) return;

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
  
  const handleSaveNote = async (highlightId, note) => {
    try {
      const updatedHighlight = await updateHighlightNote(highlightId, note);
      setHighlights(highlights.map(h => h._id === highlightId ? updatedHighlight : h));
      setSelectedHighlight(null); // Close the modal
    } catch (error) {
      console.error("Failed to save note:", error);
      alert("Error saving note.");
    }
  };

  const handleSummarize = async () => {
    setShowSummaryModal(true);
    setIsSummaryLoading(true);
    try {
      const { data } = await getSummary(pdfId);
      setSummaryData(data);
    } catch (err) {
      console.error("Failed to get summary:", err);
      // More specific error for the user
      const errorMsg = err.response?.data?.message || "Could not generate summary. Please try again later.";
      alert(errorMsg);
      setShowSummaryModal(false); // Close modal on error
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  return (
    <div className="h-screen flex flex-col bg-gray-200">
      <NoteModal 
        highlight={selectedHighlight}
        onSave={handleSaveNote}
        onCancel={() => setSelectedHighlight(null)}
      />
      {/* Conditionally render the SummaryModal only when showSummaryModal is true */}
      {showSummaryModal && (
        <SummaryModal
          summaryData={summaryData}
          isLoading={isSummaryLoading}
          onClose={() => setShowSummaryModal(false)}
        />
      )}

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
          <button onClick={handleSummarize} className="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50" disabled={isLoading}>
            Summarize (AI)
          </button>
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
                {Array.isArray(highlights) && highlights
                  .filter(h => h.pageNumber === pageNumber)
                  .map(h => (
                    <div
                      key={h._id}
                      onClick={() => setSelectedHighlight(h)}
                      className={`absolute ${h.note ? 'bg-blue-400' : 'bg-yellow-300'} bg-opacity-40 cursor-pointer hover:bg-opacity-60 transition-colors`}
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

