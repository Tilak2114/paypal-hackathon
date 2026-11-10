// backend/scripts/seed.js
require('dotenv').config();
const db = require('../db');
const paypal = require('../paypal');

const SAMPLE_DATA = [
  {
    id: 'sub-streamly',
    name: 'Streamly',
    cost: 499,
    currency: 'INR',
    lastUsed: '3 days ago',
    status: 'active',
    flag: null,
    suggestion: 'Regular streaming activity detected',
    defaultPaypalId: 'I-STRM1001001',
  },
  {
    id: 'sub-tunebox',
    name: 'TuneBox',
    cost: 119,
    currency: 'INR',
    lastUsed: '5 days ago',
    status: 'active',
    flag: null,
    suggestion: 'Active music subscription',
    defaultPaypalId: 'I-TBOX2002002',
  },
  {
    id: 'sub-tunewave',
    name: 'TuneWave',
    cost: 149,
    currency: 'INR',
    lastUsed: '52 days ago',
    status: 'active',
    flag: 'overlap',
    suggestion: 'Overlaps with TuneBox. Cancel to save ₹1,788/yr',
    defaultPaypalId: 'I-TWAV3003003',
  },
  {
    id: 'sub-fitclub',
    name: 'FitClub',
    cost: 1499,
    currency: 'INR',
    lastUsed: '45 days ago',
    status: 'active',
    flag: 'unused',
    suggestion: 'No gym check-ins in 45 days. Pause to save ₹17,988/yr',
    defaultPaypalId: 'I-FCLB4004004',
  },
  {
    id: 'sub-pixelpro',
    name: 'PixelPro',
    cost: 799,
    currency: 'INR',
    lastUsed: '14 days ago',
    status: 'active',
    flag: 'trial_ending',
    suggestion: '7-day free trial ends in 48 hours. Cancel before first charge',
    defaultPaypalId: 'I-PXLP5005005',
  },
  {
    id: 'sub-clouddrive',
    name: 'CloudDrive',
    cost: 219,
    currency: 'INR',
    lastUsed: '2 days ago',
    status: 'active',
    flag: null,
    suggestion: 'Cloud storage backup',
    defaultPaypalId: 'I-CDRV6006006',
  },
];

async function seed() {
  console.log('----------------------------------------------------');
  console.log('🌱  SEEDING SENTINEL DATABASE & PAYPAL SANDBOX');
  console.log('----------------------------------------------------');

  const isDemo = paypal.isDemoMode();
  console.log(`Execution Mode: ${isDemo ? 'DEMO_MODE (Fast SQLite seed)' : 'REAL PAYPAL SANDBOX (Creating live plans)'}`);

  // Clear existing records
  db.clearAll();
  console.log('✓ Cleared existing subscriptions table.');

  for (const item of SAMPLE_DATA) {
    let paypalSubscriptionId = item.defaultPaypalId;

    if (!isDemo) {
      try {
        console.log(`Creating PayPal Sandbox product & plan for "${item.name}"...`);
        const prod = await paypal.createProduct({
          name: item.name,
          description: `Sentinel Demo Subscription for ${item.name}`,
        });
        const plan = await paypal.createPlan({
          productId: prod.id,
          name: `${item.name} Monthly`,
          cost: (item.cost / 80).toFixed(2), // convert INR to approximate USD for sandbox
          currency: 'USD',
        });
        paypalSubscriptionId = `I-${plan.id.replace('P-', '')}`;
        console.log(`✓ Created PayPal plan ${plan.id}`);
      } catch (err) {
        console.warn(`! Could not register with PayPal Sandbox for ${item.name}: ${err.message}. Using default ID.`);
      }
    }

    const inserted = db.createSubscription({
      id: item.id,
      name: item.name,
      cost: item.cost,
      currency: item.currency,
      lastUsed: item.lastUsed,
      status: item.status,
      flag: item.flag,
      suggestion: item.suggestion,
      paypalSubscriptionId,
    });

    console.log(`+ Seeded: ${inserted.name} (Cost: ₹${inserted.cost}, Status: ${inserted.status}, Flag: ${inserted.flag || 'none'}, PayPal: ${inserted.paypalSubscriptionId})`);
  }

  console.log('----------------------------------------------------');
  console.log(`✨ Successfully seeded ${SAMPLE_DATA.length} subscriptions into Sentinel SQLite DB!`);
  console.log('----------------------------------------------------');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed process failed:', err);
    process.exit(1);
  });
