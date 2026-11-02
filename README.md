# Churn Guard (PayPal Hackathon 2026)

Cancel what you forgot you were paying for.

## Data Contract (Agreed across Person A, B, and C)

### Subscription Schema
```json
[
  {
    "id": "1",
    "name": "Streamly",
    "cost": 15.99,
    "lastUsed": "2 days ago",
    "status": "active", // "active" | "paused" | "cancelled"
    "flag": null,       // null | "overlap" | "trial_ending" | "unused" | "low_usage"
    "suggestion": null, // string recommendation or null
    "color": "#7b6cff",
    "category": "Entertainment"
  }
]
```

### Endpoints (Person B & C)
- `GET /subscriptions` &rarr; Returns array of subscriptions
- `POST /subscriptions/:id/pause` &rarr; Pauses subscription via PayPal Subscriptions API
- `POST /subscriptions/:id/cancel` &rarr; Cancels subscription via PayPal Subscriptions API
- `POST /subscriptions/:id/undo` &rarr; Restores subscription
- `POST /analyze` `{ text: string }` &rarr; AI parsing endpoint (Person C) returning `{ detected: [...] }`

## Frontend Setup (Person A)
- **Stack**: React + Vite + Tailwind CSS + Three.js
- **Folder**: `frontend/`
- **Commands**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
