# Churn Guard AI Engine — Integration Contract (Person C)

Standalone AI parsing, audit, and saver engine for Churn Guard.
Maintained by **Person C**. Fully decoupled from frontend (Person A) and PayPal sandbox (Person B).

---

## 1. Quick Mount for Person B (Backend)

Person B can mount the entire `/ai` suite into their FastAPI backend with **one line**:

```python
from fastapi import FastAPI
from ai.router import ai_router

app = FastAPI(title="Churn Guard Backend")
app.include_router(ai_router)
```

Alternatively, import the pure functions directly in Python:
```python
from ai.parser import parse_subscriptions
from ai.audit import audit
from ai.saver import recommend, summarize
from ai.alerts import build_alerts
```

---

## 2. API Endpoints

### `POST /ai/parse`
Parses messy statement text, bank CSVs, or receipt emails into validated `Subscription` objects.

**Request Body**:
```json
{
  "raw_text": "From: billing@pixelpro.studio\nSubject: Free Trial Ending\nYour card will be billed $22.50 monthly starting Nov 11, 2026."
}
```

**Response (`200 OK`)**:
```json
[
  {
    "id": "sub-1",
    "name": "PixelPro Studio",
    "merchant": "PixelPro",
    "category": "software",
    "amount": 22.50,
    "currency": "USD",
    "billing_cycle": "monthly",
    "next_charge_date": "2026-11-11",
    "status": "trial",
    "trial_end_date": "2026-11-11",
    "previous_amount": null,
    "last_used_date": null,
    "source": "pasted",
    "confidence_score": 0.96
  }
]
```

---

### `POST /ai/audit`
Runs deterministic rules (unused >60d, category overlap, duplicate merchants, price hikes, trial ending <=3d, annual renewal <=7d).

**Request Body**:
```json
{
  "subscriptions": [ /* list of Subscription objects */ ],
  "today": "2026-11-09"
}
```

**Response (`200 OK`)**:
```json
[
  {
    "id": "find-1",
    "type": "category_overlap",
    "severity": "med",
    "subscription_ids": ["sub-1", "sub-2"],
    "monthly_savings_estimate": 10.99,
    "description": "Category overlap in 'music': multiple active services detected (Spotify Premium, Apple Music Individual)."
  },
  {
    "id": "find-2",
    "type": "trial_ending",
    "severity": "high",
    "subscription_ids": ["sub-3"],
    "monthly_savings_estimate": 22.50,
    "description": "Free trial for 'PixelPro Studio' ends in 2 days on 2026-11-11. Auto-converts to $22.50."
  }
]
```

---

### `POST /ai/alerts`
Returns alerts prioritized for **Person A's** UI buttons. Sorted primarily by urgency (`high` &gt; `med` &gt; `low`) and secondarily by due date.

**Request Body**:
```json
{
  "subscriptions": [ /* list of Subscription objects */ ],
  "today": "2026-11-09"
}
```

**Response (`200 OK`)**:
```json
[
  {
    "id": "alert-1",
    "title": "Free Trial Expiring: PixelPro Studio",
    "body": "Ends in 2 days. Converts to recurring $22.50/mo.",
    "due_date": "2026-11-11",
    "urgency": "high",
    "suggested_action": "cancel",
    "subscription_id": "sub-3"
  }
]
```
*(Person A wires `suggested_action` directly to PayPal Action Buttons: `pause`, `cancel`, `downgrade`, or `keep`).*

---

### `POST /ai/recommend`
Produces an action and plain-English justification under 25 words with specific figures.

**Response**:
```json
{
  "action": "cancel",
  "reason": "Trial converts soon to $22.50/mo. Cancel via PayPal now to save $270/yr.",
  "confidence": 0.98,
  "monthly_savings": 22.50
}
```

---

### `POST /ai/summarize`
Aggregates findings for the dashboard banner.

**Response**:
```json
{
  "total_yearly_savings": 3840.0,
  "headline": "Found 5 subscription leaks: recover $3,840/year with one tap.",
  "findings_count": 5
}
```

---

## 3. Environment Variables

| Variable | Description | Default | Required? |
| :--- | :--- | :--- | :--- |
| `ANTHROPIC_API_KEY` | Claude API secret key | `None` | Optional *(falls back to deterministic engine for offline demo reliability)* |
| `CLAUDE_MODEL` | Claude model name | `claude-sonnet-5-5` | Optional |

---

## 4. Running the Tests

```bash
python3 -m pytest ai/tests -v
```
All tests run with a fixed reference date (`2026-11-09`) for 100% deterministic reproducibility.
