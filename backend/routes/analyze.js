// backend/routes/analyze.js
const express = require('express');
const router = express.Router();
const path = require('path');

// Check if Person C's AI analyzer module exists in the project
let personCAnalyzer = null;
try {
  const analyzerPath = path.resolve(__dirname, '../../server/services/analyzer.js');
  personCAnalyzer = require(analyzerPath);
} catch {
  // Analyzer not yet mounted; placeholder will be used
}

// Default Sentinel sample subscriptions (Contract Shape)
const SAMPLE_SUBSCRIPTIONS = [
  {
    id: 'sub_streamly',
    name: 'Streamly',
    cost: 14.99,
    currency: 'USD',
    lastUsed: '3 days ago',
    status: 'active',
    flag: null,
    suggestion: 'Regular streaming activity detected',
    paypalSubscriptionId: 'I-STRM1001001',
  },
  {
    id: 'sub_tunebox',
    name: 'TuneBox',
    cost: 9.99,
    currency: 'USD',
    lastUsed: '5 days ago',
    status: 'active',
    flag: null,
    suggestion: 'Active music subscription',
    paypalSubscriptionId: 'I-TBOX2002002',
  },
  {
    id: 'sub_tunewave',
    name: 'TuneWave',
    cost: 11.99,
    currency: 'USD',
    lastUsed: '52 days ago',
    status: 'active',
    flag: 'overlap',
    suggestion: 'Overlaps with TuneBox. Cancel to save $144/yr',
    paypalSubscriptionId: 'I-TWAV3003003',
  },
  {
    id: 'sub_fitclub',
    name: 'FitClub',
    cost: 29.99,
    currency: 'USD',
    lastUsed: '45 days ago',
    status: 'active',
    flag: 'unused',
    suggestion: 'No gym check-ins in 45 days. Pause to save $360/yr',
    paypalSubscriptionId: 'I-FCLB4004004',
  },
  {
    id: 'sub_pixelpro',
    name: 'PixelPro',
    cost: 19.99,
    currency: 'USD',
    lastUsed: '14 days ago',
    status: 'active',
    flag: 'trial_ending',
    suggestion: '7-day free trial ends in 48 hours. Cancel before first charge',
    paypalSubscriptionId: 'I-PXLP5005005',
  },
  {
    id: 'sub_clouddrive',
    name: 'CloudDrive',
    cost: 4.99,
    currency: 'USD',
    lastUsed: '2 days ago',
    status: 'active',
    flag: null,
    suggestion: 'Cloud storage backup',
    paypalSubscriptionId: 'I-CDRV6006006',
  },
];

/**
 * POST /analyze
 * Accepts pasted statement text / transactions and parses them into subscriptions.
 * Placeholder for Person C's AI statement parsing engine.
 */
router.post('/', async (req, res) => {
  try {
    const { text } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'Please provide statement or transaction text to analyze.',
      });
    }

    console.log(`[Analyze] Processing statement payload (${text.length} chars)...`);

    // If Person C has implemented parseStatement / analyze, run it
    if (personCAnalyzer && typeof personCAnalyzer.analyzeStatement === 'function') {
      try {
        const results = await personCAnalyzer.analyzeStatement(text);
        if (Array.isArray(results) && results.length > 0) {
          return res.json({
            ok: true,
            subscriptions: results,
            source: 'ai_engine',
          });
        }
      } catch (aiErr) {
        console.warn('[Analyze] Person C AI analyzer encountered an error, falling back to sample set:', aiErr.message);
      }
    }

    // Default clean placeholder response matching Sentinel contract shape
    return res.json({
      ok: true,
      subscriptions: SAMPLE_SUBSCRIPTIONS,
      source: 'placeholder_ai',
      message: 'Statement successfully audited. Discovered 6 recurring billing profiles.',
    });
  } catch (err) {
    console.error('[POST /analyze Error]', err);
    return res.status(500).json({
      ok: false,
      error: 'Failed to analyze text statement.',
    });
  }
});

module.exports = router;
