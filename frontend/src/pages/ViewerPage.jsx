import React, { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { getHighlights, createHighlight, updateHighlightNote } from '../api/highlights';
import { getSummary } from '../api/nlp';
import * as fabric from 'fabric'; 

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;


const NoteModal = ({ highlight, onSave, onCancel }) => {
  const [noteText, setNoteText] = useState('');
  useEffect(() => {
    if (highlight) setNoteText(highlight.note || '');
  }, [highlight]);

  if (!highlight) return null;
  const handleSave = () => onSave(highlight._id, noteText);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Edit Note</h3>
        <blockquote className="text-sm text-gray-600 bg-gray-100 p-3 rounded-md mb-4 border-l-4 border-indigo-300">
          "{highlight?.type === 'text' ? highlight.content.text : '[Drawing Annotation]'}"
        </blockquote>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="w-full h-40 p-3 border rounded-md"
          placeholder="Add comments..."
        />
        <div className="mt-5 flex justify-end space-x-3">
          <button onClick={onCancel} className="px-5 py-2 bg-gray-200 rounded-md">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 text-white rounded-md">Save Note</button>
        </div>
      </div>
    </div>
  );
};


const SummaryModal = ({ summaryData, isLoading, onClose }) => {
  if (!summaryData && !isLoading) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h3 className="text-xl font-semibold mb-4">AI Summary & Key Phrases</h3>
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          summaryData && (
            <div>
              <h4 className="font-semibold mb-2">Summary</h4>
              <p className="bg-gray-50 p-3 rounded-md mb-4">{summaryData.summary}</p>
              <h4 className="font-semibold mb-2">Key Phrases</h4>
              <div className="flex flex-wrap gap-2">
                {summaryData.keyPhrases.map((phrase, i) => (
                  <span key={i} className="bg-blue-100 text-blue-800 text-sm px-2.5 py-0.5 rounded-full">
                    {phrase}
                  </span>
                ))}
              </div>
            </div>
          )
        )}
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-gray-200 rounded-md">Close</button>
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
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [mode, setMode] = useState('highlight');
  const [saveStatus, setSaveStatus] = useState('');

  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const pdfContainerRef = useRef(null);
  const saveDrawingDebounced = useRef(null);

  const fetchHighlights = useCallback(async () => {
    if (pdfId) {
      try {
        const fetchedHighlights = await getHighlights(pdfId);
        setHighlights(fetchedHighlights || []);
      } catch (err) {
        console.error("Failed to fetch highlights:", err);
        setError("Failed to load highlights");
      }
    }
  }, [pdfId]);

  const handleSaveDrawing = async (canvas) => {
    try {
      const drawingData = JSON.stringify(canvas.toJSON()); 
      await createHighlight(pdfId, { type: 'drawing', drawingData, pageNumber });
      await fetchHighlights();
    } catch (err) {
      console.error("Failed to save drawing:", err);
    }
  };

  useLayoutEffect(() => {
    if (!canvasDimensions.width || !canvasDimensions.height) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasDimensions.width,
      height: canvasDimensions.height,
      selection: false,
    });
    fabricRef.current = canvas;

    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = '#ef4444';
    canvas.freeDrawingBrush.width = 4;

    const handleObjectAdded = () => {
      if (saveDrawingDebounced.current) {
        clearTimeout(saveDrawingDebounced.current);
      }
      saveDrawingDebounced.current = setTimeout(() => {
        handleSaveDrawing(fabricRef.current);
      }, 100000); 
    };

    canvas.on('object:added', handleObjectAdded);

    return () => {
      canvas.off('object:added', handleObjectAdded);
      canvas.dispose();
    };
  }, [canvasDimensions.width, canvasDimensions.height]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !canvasDimensions.width || !canvasDimensions.height) return;

    const drawing = highlights.find(
      (h) => h.type === "drawing" && h.pageNumber === pageNumber
    );

    if (drawing && drawing.drawingData) {
      const parsed = typeof drawing.drawingData === "string"
        ? JSON.parse(drawing.drawingData)
        : drawing.drawingData;

      canvas.loadFromJSON(parsed, () => {
        canvas.forEachObject((obj) => {
          obj.fromSavedData = true;
          obj.selectable = false;
          obj.evented = false;
        });
        canvas.renderAll();
      });
    } else {
      canvas.clear();
    }
  }, [pageNumber, canvasDimensions, highlights]);

  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.isDrawingMode = mode === 'freehand';
    }
  }, [mode]);

  useEffect(() => {
    fetchHighlights();
  }, [pdfId, fetchHighlights]);

  const pdfUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/pdfs/${pdfId}/file`;
  const options = useMemo(() => ({ httpHeaders: { Authorization: `Bearer ${localStorage.getItem('token')}` } }), []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setIsLoading(false);
  }

  function onDocumentLoadError() {
    setError('Failed to load the PDF.');
    setIsLoading(false);
  }

  const handleMouseUp = async () => {
    if (mode !== 'highlight' || selectedHighlight || showSummaryModal) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !pdfContainerRef.current) return;

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (!text) {
      selection.removeAllRanges();
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = pdfContainerRef.current.getBoundingClientRect();
    const position = {
      x1: (rect.left - containerRect.left),
      y1: (rect.top - containerRect.top),
      width: rect.width,
      height: rect.height,
    };

    if (window.confirm("Add this highlight?")) {
      try {
        const newHighlight = await createHighlight(pdfId, { type: 'text', content: { text }, position, pageNumber });
        setHighlights((prev) => [...prev, newHighlight]);
      } catch (err) { console.error("Failed to save highlight:", err); }
    }
    selection.removeAllRanges();
  };

  const handleSaveNote = async (highlightId, note) => {
    try {
      await updateHighlightNote(highlightId, note);
      await fetchHighlights();
      setSelectedHighlight(null);
    } catch (error) { console.error("Failed to save note:", error); }
  };

  const handleClearCanvas = () => {
    if (fabricRef.current && window.confirm("Clear all drawings on this page?")) {
      fabricRef.current.clear();
      handleSaveDrawing(fabricRef.current); 
    }
  };

  const handleSummarize = async () => {
    setShowSummaryModal(true);
    setIsSummaryLoading(true);
    try {
      const { data } = await getSummary(pdfId);
      setSummaryData(data);
    } catch (err) {
      alert(err.response?.data?.message || "Could not generate summary.");
      setShowSummaryModal(false);
    } finally { setIsSummaryLoading(false); }
  };

  const goToPrevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber((prev) => Math.min(prev + 1, numPages));
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

  return (
    <div className="h-screen flex flex-col bg-gray-200">
      <NoteModal highlight={selectedHighlight} onSave={handleSaveNote} onCancel={() => setSelectedHighlight(null)} />
      {showSummaryModal && <SummaryModal summaryData={summaryData} isLoading={isSummaryLoading} onClose={() => setShowSummaryModal(false)} />}

      <header className="bg-white shadow-md p-3 flex items-center justify-between z-20">
        <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
          &larr; Dashboard
        </Link>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 border rounded-lg p-1 bg-gray-50">
            <button onClick={() => setMode('highlight')} className={`px-3 py-1 text-sm rounded ${mode === 'highlight' ? 'bg-indigo-600 text-white shadow' : 'bg-white hover:bg-gray-200'}`}>Highlight</button>
            <button onClick={() => setMode('freehand')} className={`px-3 py-1 text-sm rounded ${mode === 'freehand' ? 'bg-indigo-600 text-white shadow' : 'bg-white hover:bg-gray-200'}`}>Draw</button>
          </div>
          {mode === 'freehand' && <button onClick={handleClearCanvas} className="px-3 py-2 rounded bg-red-500 text-white text-sm hover:bg-red-600">Clear Drawings</button>}
          <button onClick={handleSummarize} className="px-4 py-2 rounded bg-purple-600 text-white text-sm hover:bg-purple-700" disabled={isLoading}>Summarize (AI)</button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1">
            <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="disabled:opacity-40 px-2 py-1 hover:bg-gray-200 rounded">←</button>
            <span className="text-sm">Page {pageNumber} of {numPages || '--'}</span>
            <button onClick={goToNextPage} disabled={!numPages || pageNumber >= numPages} className="disabled:opacity-40 px-2 py-1 hover:bg-gray-200 rounded">→</button>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1">
            <button onClick={zoomOut} className="px-2 py-1 hover:bg-gray-200 rounded">Zoom -</button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} className="px-2 py-1 hover:bg-gray-200 rounded">Zoom +</button>
          </div>
        </div>
      </header>

      {saveStatus && <div className={`py-2 text-center ${saveStatus.includes('Failed') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{saveStatus}</div>}

      <main className="flex-1 overflow-auto">
        <div className="flex justify-center p-4">
          {error && <div className="text-red-500 p-8">{error}</div>}
          {!error && (
            <div
              ref={pdfContainerRef}
              onMouseUp={handleMouseUp}
              className="relative shadow-lg bg-white"
            >
              <Document
                file={pdfUrl}
                options={options}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="w-full h-96 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  onRenderSuccess={(page) => {
                    const viewport = page.getViewport({ scale });
                    setCanvasDimensions({ width: viewport.width, height: viewport.height });
                  }}
                />
                {Array.isArray(highlights) && highlights
                  .filter((h) => h.type === 'text' && h.pageNumber === pageNumber)
                  .map((h) => (
                    <div
                      key={h._id}
                      onClick={() => setSelectedHighlight(h)}
                      className={`absolute ${h.note ? 'bg-blue-400' : 'bg-yellow-300'} bg-opacity-40 cursor-pointer`}
                      style={{
                        left: `${h.position.x1}px`,
                        top: `${h.position.y1}px`,
                        width: `${h.position.width}px`,
                        height: `${h.position.height}px`,
                      }}
                    />
                  ))}
              </Document>

              <div className="absolute top-0 left-0 z-10" style={{ pointerEvents: mode === 'highlight' ? 'none' : 'auto' }}>
                <canvas ref={canvasRef} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
