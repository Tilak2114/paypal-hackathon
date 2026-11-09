# Smart Subscription & Churn Guard (PayPal AI Hackathon 2026)

Cancel what you forgot you were paying for.

---

## Architecture Overview

```
paypal-hackathon/
├── frontend/             # Person A: React + Vite + Tailwind + Three.js
├── backend/              # Person B: Node.js + TypeScript + Express + SQLite + PayPal API
│   ├── docs/
│   │   ├── contract.md   # Shared Data Contract across Persons A, B, and C
│   │   └── openapi.yaml  # OpenAPI 3.0.3 specification
│   ├── src/
│   └── package.json
└── README.md
```

---

## Backend (Person B) Setup

```bash
cd backend
npm install
npm run seed       # Seed realistic subscriptions & alerts
npm run dev        # Starts backend API on http://localhost:3000
npm run test:smoke # Run automated smoke tests
```

### Shared Data Contract & API Docs
- **Contract Documentation**: [docs/contract.md](file:///c:/Users/aryan/OneDrive/Documents/hackathon%202.0/backend/docs/contract.md)
- **OpenAPI Specification**: [docs/openapi.yaml](file:///c:/Users/aryan/OneDrive/Documents/hackathon%202.0/backend/docs/openapi.yaml)
- **TypeScript Contract Source**: [src/contract.ts](file:///c:/Users/aryan/OneDrive/Documents/hackathon%202.0/backend/src/contract.ts)
