# Smart Subscription & Churn Guard (PayPal AI Hackathon 2026)

Cancel what you forgot you were paying for.

---

## 🏛️ Integrated Architecture Overview

```
paypal-hackathon/
├── frontend/             # Person A: React + Vite + Tailwind CSS + Three.js
├── backend/              # Person B: Node.js + TypeScript + Express + SQLite + PayPal Subscriptions v1 API
│   ├── docs/
│   │   ├── contract.md   # Shared Data Contract across Persons A, B, and C
│   │   ├── openapi.yaml  # OpenAPI 3.0.3 specification
│   │   └── churnguard.postman_collection.json # Postman Collection
│   ├── src/
│   └── package.json
└── ai/                   # Person C: AI Parser, Auditor, & Saver Engine (Claude API)
```

---

## 🚀 Running the Project

### 1. Backend (Person B)
```bash
cd backend
npm install
npm run seed       # Seeds subscriptions & alerts (Mock or Real)
npm run dev        # Starts backend API on http://localhost:3000
npm run test:smoke # Runs 18 automated integration tests
```

### 2. Frontend (Person A)
```bash
cd frontend
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173
```
*Connected to Backend via `VITE_API_URL=http://localhost:3000/api`.*

### 3. AI Auditor & Parser (Person C)
```bash
cd ai
pip install -r requirements.txt
pytest             # Run AI parser, alert generation, and audit tests
```

---

## 📋 Data Contract & API Specifications
- **Contract Documentation**: [backend/docs/contract.md](file:///c:/Users/aryan/OneDrive/Documents/hackathon%202.0/backend/docs/contract.md)
- **OpenAPI 3.0 Specification**: [backend/docs/openapi.yaml](file:///c:/Users/aryan/OneDrive/Documents/hackathon%202.0/backend/docs/openapi.yaml)
- **Postman Collection**: [backend/docs/churnguard.postman_collection.json](file:///c:/Users/aryan/OneDrive/Documents/hackathon%202.0/backend/docs/churnguard.postman_collection.json)
- **TypeScript Contract Source**: [backend/src/contract.ts](file:///c:/Users/aryan/OneDrive/Documents/hackathon%202.0/backend/src/contract.ts)
