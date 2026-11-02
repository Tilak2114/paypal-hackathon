import React, { useState } from 'react';
import { analyze } from '../api/client';
import SubscriptionCard from '../components/SubscriptionCard';

export default function AddSubscriptions({ onNavigate }) {
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
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => onNavigate('dashboard')}
          className="text-xs font-semibold text-mute hover:text-ink transition-colors flex items-center gap-1.5 mb-3"
        >
          ← Return to Dashboard
        </button>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-ink tracking-tight">
          AI Statement & Subscription Scanner
        </h1>
        <p className="text-mute text-sm mt-1.5 leading-relaxed">
          Paste exported statements, bank transaction summaries, or messy subscription lists.
          Person C's parsing model detects amounts, frequencies, and idle usage flags automatically.
        </p>
      </div>

      {/* Input Form Card */}
      <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-5">
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
              className="text-xs text-mint hover:underline font-semibold"
            >
              Load Example Statement
            </button>
          </div>

          <textarea
            rows={6}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g. Spotify 10.99 monthly, Netflix $22.99, Gym membership $280, Adobe Creative Cloud..."
            className="w-full bg-slate-950/60 border border-line rounded-2xl p-4 text-ink font-mono text-sm placeholder:text-mute/40 focus:outline-none focus:border-mint/60 transition-colors resize-y"
          />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
          <div className="text-xs text-mute flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-mint" />
            <span>Parses dates, currency symbols, and merchant entities.</span>
          </div>

          <button
            onClick={() => handleScan()}
            disabled={scanning || !inputText.trim()}
            className="px-7 py-3 rounded-full bg-mint hover:bg-mint/90 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-lg shadow-mint/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            {scanning ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Running AI Extractor...</span>
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
            <h2 className="font-display font-bold text-xl text-ink flex items-center gap-2">
              <span>Parsed Candidates ({results.length})</span>
              <span className="text-xs font-normal text-mint px-2.5 py-0.5 rounded-full bg-mint/10 border border-mint/20">
                Added to your audit queue
              </span>
            </h2>

            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold hover:bg-indigo-500/30 transition-all"
            >
              View in Dashboard →
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
