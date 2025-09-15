import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getPdfs, uploadPdf, deletePdf, renamePdf } from '../api/pdfs';

export default function DashboardPage() {
  const [pdfs, setPdfs] = useState([]);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  const [editingPdfUuid, setEditingPdfUuid] = useState(null);
  const [newName, setNewName] = useState('');

  const fetchPdfs = async () => {
    try {
      setLoading(true);
      const userPdfs = await getPdfs();
      setPdfs(userPdfs);
      setError('');
    } catch (err) {
      setError('Failed to fetch PDFs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    try {
      setLoading(true);
      await uploadPdf(file);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
      await fetchPdfs();
    } catch (err) {
      setError('Failed to upload PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uuid) => {
    if (window.confirm('Are you sure you want to delete this PDF?')) {
      try {
        await deletePdf(uuid);
        setPdfs(pdfs.filter((pdf) => pdf.uuid !== uuid));
      } catch (err) {
        setError('Failed to delete PDF.');
      }
    }
  };

  const handleRenameClick = (pdf) => {
    setEditingPdfUuid(pdf.uuid);
    setNewName(pdf.originalFilename);
  };

  const handleCancelRename = () => {
    setEditingPdfUuid(null);
    setNewName('');
  };

  const handleSaveRename = async (uuid) => {
    if (!newName.trim()) {
      setError('Filename cannot be empty.');
      return;
    }
    try {
      await renamePdf(uuid, newName.trim());
      setPdfs(pdfs.map(pdf => 
        pdf.uuid === uuid ? { ...pdf, originalFilename: newName.trim() } : pdf
      ));
      handleCancelRename(); 
    } catch (err) {
      setError('Failed to rename PDF.');
    }
  };
  
  return (
    <div>
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Upload New PDF</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <button
                onClick={handleUpload}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                disabled={!file}
              >
                Upload
              </button>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mb-4">My Library</h2>
          {loading ? (
            <p>Loading PDFs...</p>
          ) : pdfs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {pdfs.map((pdf) => (
                <div key={pdf.uuid} className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
                  {editingPdfUuid === pdf.uuid ? (
                    <div className="mb-4">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(pdf.uuid)}
                        className="w-full p-1 border border-indigo-300 rounded"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <p className="font-semibold text-gray-800 truncate mb-4">{pdf.originalFilename}</p>
                  )}
                  {editingPdfUuid === pdf.uuid ? (
                    <div className="flex items-center justify-between">
                      <button onClick={() => handleSaveRename(pdf.uuid)} className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600">
                        Save
                      </button>
                      <button onClick={handleCancelRename} className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/viewer/${pdf.uuid}`}
                        className="px-3 py-1 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-600"
                      >
                        Open
                      </Link>
                      <div className='flex items-center space-x-2'>
                        <button onClick={() => handleRenameClick(pdf)} className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
                          Rename
                        </button>
                        <button onClick={() => handleDelete(pdf.uuid)} className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600">
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
               
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Your library is empty. Upload your first PDF!</p>
          )}
        </div>
      </main>
    </div>
  );
}