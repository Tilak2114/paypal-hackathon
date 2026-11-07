import React, { useState } from 'react';
import { analyze } from '../api/client';
import SubscriptionCard from '../components/SubscriptionCard';

export default function AddSubscriptions({ onNavigate, onScanComplete }) {
  const [inputText, setInputText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);

  const samplePrompt = `Mar 01 - NETFLIX.COM PAYMENT - $22.99
Mar 03 - SPOTIFY PREMIUM - $16.99
Mar 12 - EQUINOX GYM CLUB - $280.00
Mar 15 - OPENAI CHATGPT PLUS - $20.00`;

  const handleScan = async (textToScan) => {
    const text = textToScan || inputText;
    if (!text.trim()) return;

    try {
      setScanning(true);
      const res = await analyze(text);
      setResults(res.detected || []);
      if (onScanComplete) onScanComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      {/* Header with Navigation Link back to Dashboard */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-xs font-semibold text-mute hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            ← Back to Dashboard
          </button>
          
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer"
            style={{
              border: '1px solid rgba(0, 210, 255, 0.4)',
              color: '#00d2ff',
              background: 'rgba(0, 210, 255, 0.08)'
            }}
          >
            View Active Subscriptions →
          </button>
        </div>

        <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
          AI Statement & Subscription Scanner
        </h1>
        <p className="text-mute text-sm mt-1.5 leading-relaxed">
          Step 2 of your flow: Paste your bank statement, credit card summary, or raw text below.
          Our parsing model extracts recurring merchants, amounts, and waste flags automatically.
        </p>
      </div>

      {/* Input Form Card */}
      <div 
        className="rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-5"
        style={{
          background: 'rgba(11, 22, 46, 0.75)',
          border: '1px solid rgba(0, 210, 255, 0.25)'
        }}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase font-bold tracking-wider text-mute">
              Paste Raw Transactions or Text
            </label>
            <button
              onClick={() => {
                setInputText(samplePrompt);
                handleScan(samplePrompt);
              }}
              className="text-xs hover:underline font-semibold cursor-pointer"
              style={{ color: '#00d2ff' }}
            >
              Load Example Statement
            </button>
          </div>

          <textarea
            rows={6}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g. Spotify 10.99 monthly, Netflix $22.99, Gym membership $280, Adobe Creative Cloud..."
            className="w-full bg-[#050a17]/90 rounded-2xl p-4 text-white font-mono text-sm placeholder:text-mute/40 focus:outline-none transition-colors resize-y"
            style={{
              border: '1px solid rgba(0, 210, 255, 0.3)'
            }}
          />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
          <div className="text-xs text-mute flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: '#00d2ff' }} />
            <span>AI extracts merchants, frequencies, and cancellation links.</span>
          </div>

          <button
            onClick={() => handleScan()}
            disabled={scanning || !inputText.trim()}
            className="px-7 py-3 rounded-full disabled:opacity-50 font-bold text-sm shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            style={{
              background: '#00d2ff',
              color: '#030814',
              boxShadow: '0 0 25px rgba(0, 210, 255, 0.35)'
            }}
          >
            {scanning ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Extracting Subscriptions...</span>
              </>
            ) : (
              <span>Scan & Identify Subscriptions →</span>
            )}
          </button>
        </div>
      </div>

      {/* Extracted Output Section */}
      {results && (
        <div className="space-y-4 pt-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
              <span>Parsed Candidates ({results.length})</span>
              <span 
                className="text-xs font-normal px-2.5 py-0.5 rounded-full"
                style={{
                  background: 'rgba(0, 210, 255, 0.1)',
                  color: '#00d2ff',
                  border: '1px solid rgba(0, 210, 255, 0.3)'
                }}
              >
                Added to your audit queue
              </span>
            </h2>

            <button
              onClick={() => onNavigate('dashboard')}
              className="px-5 py-2.5 rounded-full text-xs font-extrabold transition-all cursor-pointer shadow-lg"
              style={{
                background: '#00d2ff',
                color: '#030814',
                boxShadow: '0 0 20px rgba(0, 210, 255, 0.35)'
              }}
            >
              Continue to Dashboard →
            </button>
          </div>

          <div className="space-y-3">
            {results.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                onPause={() => {}}
                onCancel={() => {}}
                onUndo={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
