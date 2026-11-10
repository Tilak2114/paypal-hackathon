// frontend/src/components/StatementUpload.jsx
import React, { useState, useRef } from 'react';

const SAMPLE_CSV = `Date,Description,Amount,Currency,Type
2026-11-01,Spotify USA,10.99,USD,Subscription
2026-10-28,Apple Services,10.99,USD,Subscription
2026-10-25,PixelPro Studio,22.50,USD,Subscription
2026-10-20,Netflix.com,17.99,USD,Subscription
2026-10-15,CloudDrive Storage,9.99,USD,Subscription
`;

export default function StatementUpload({ onUploadSuccess, onBackToOAuth }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const validateFile = (selected) => {
    setError(null);
    if (!selected) return false;

    const allowedExts = ['csv', 'pdf'];
    const ext = selected.name.split('.').pop().toLowerCase();

    if (!allowedExts.includes(ext)) {
      setError("Invalid file format. Please upload a .csv or .pdf statement.");
      return false;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError("File exceeds 10 MB limit. Please upload a smaller statement.");
      return false;
    }

    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      if (validateFile(dropped)) {
        setFile(dropped);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const picked = e.target.files[0];
      if (validateFile(picked)) {
        setFile(picked);
      }
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'paypal_sample_statement.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      // Simulate statement ingestion
      await new Promise((r) => setTimeout(r, 650));
      if (onUploadSuccess) onUploadSuccess(file);
    } catch (err) {
      setError(err.message || "Failed to parse statement. Please check file format.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      className="rounded-3xl p-6 sm:p-8 space-y-6 text-left"
      style={{
        background: 'var(--card-surface)',
        border: '1px solid var(--card-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-white">Upload PayPal Statement</h3>
          <p className="text-xs text-mute">Export your monthly statement from PayPal and drop it here</p>
        </div>
        <button
          type="button"
          onClick={onBackToOAuth}
          className="text-xs font-semibold text-mint hover:underline cursor-pointer"
        >
          ← Use OAuth instead
        </button>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragOver 
            ? 'border-mint bg-mint/10 scale-[1.01]' 
            : file 
            ? 'border-mint/50 bg-bg2/80' 
            : 'border-line hover:border-mint/50 bg-bg2/40'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.pdf,text/csv,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload PayPal Statement"
        />

        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-mint/10 border border-mint/20 flex items-center justify-center text-2xl text-mint">
            {file ? '📄' : '📤'}
          </div>

          {file ? (
            <div>
              <p className="font-bold text-sm text-white">{file.name}</p>
              <p className="text-xs text-mute mt-0.5">{(file.size / 1024).toFixed(1)} KB — Click to change</p>
            </div>
          ) : (
            <div>
              <p className="font-bold text-sm text-white">Drag & drop your statement here, or browse</p>
              <p className="text-xs text-mute mt-1">Accepts .CSV or .PDF (Max 10 MB)</p>
            </div>
          )}
        </div>
      </div>

      {/* Inline Error */}
      {error && (
        <div className="p-3 rounded-xl bg-coral/15 border border-coral/30 text-xs text-coral font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Sample download & instructions */}
      <div className="flex items-center justify-between text-xs text-mute pt-1">
        <span>Need a test file?</span>
        <button
          type="button"
          onClick={downloadSample}
          className="text-mint font-semibold hover:underline cursor-pointer flex items-center gap-1"
        >
          <span>📥 Download a sample file</span>
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full py-3.5 px-6 rounded-full font-bold text-sm text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #00d2ff, #0070ba)',
          boxShadow: '0 6px 20px rgba(0, 210, 255, 0.35)'
        }}
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>Analyzing statement contents...</span>
          </>
        ) : (
          <>
            <span>Analyze Statement</span>
            <span>→</span>
          </>
        )}
      </button>
    </div>
  );
}
