# Churn Guard — Hackathon Pitch Deck (7 Slides)

*Audience: Hackathon Judges*  
*Timing: 2 minutes 20 seconds total (~20 seconds per slide)*  
*Style: Minimalist, one core idea per slide, large headline typography, zero bullet walls.*

---

## Slide 1: The Hook

# $133 Every Month.
### The average American wastes $133/month on recurring subscriptions they completely forgot they were paying for.

*Visual: Minimal dark navy background with oversized cyan typography (`$133 / mo`).*

> **Speaker Notes (0:00 – 0:20)**:  
> "Judges, quick question: how many subscriptions are you paying for right now? Most people guess four or five. The real average is twelve. That’s $133 every single month leaking out of our bank accounts on forgotten trials, duplicate apps, and stealth price increases. That’s over $1,500 a year of pure financial leakage. We built Churn Guard to stop it."

---

## Slide 2: The Problem

# Friction by Design.
### Merchants deliberately bury cancellation links, disguise charges on statements, and count on human inertia.

*Visual: Split view showing a confusing statement string (`NFLX*STRM 17.99`) vs a labyrinth of 6 cancellation confirmation screens.*

> **Speaker Notes (0:20 – 0:40)**:  
> "Why haven't people solved this? Because subscription churn is defended by dark patterns. Cancellation buttons are hidden behind multi-page guilt trips, free trials auto-convert silently at midnight, and bank statements use cryptic codes like 'NFLX*STRM' so you scroll right past them. The friction is engineered. To beat it, users need an autonomous agent on their side."

---

## Slide 3: Live Demo

# Meet Churn Guard.
### Paste any statement or connect PayPal. In 3 seconds, your subscription leak audit is ready.

```text
+-------------------------------------------------------------------------+
| [ SCREENSHOT: Person A's 3D Hero + AI Statement Scanner ]               |
| User pastes raw statement text -> Instant Pydantic parsing              |
+-------------------------------------------------------------------------+
| [ SCREENSHOT: Person A's Dashboard & Savings Meter ]                    |
| Found $3,840/yr waste -> [Pause with PayPal] [Cancel with PayPal]       |
+-------------------------------------------------------------------------+
```

> **Speaker Notes (0:40 – 1:00)**:  
> "Let’s see it live. You paste in a raw bank export or receipt text. Immediately, Churn Guard standardizes the merchants, extracts the dates, and calculates your exact annual burn. Notice the dashboard: it flags Spotify and Apple Music overlapping, a gym unused for 90 days, and a trial expiring in 48 hours. And with one tap, you take action."

---

## Slide 4: How the AI Works

# Parse &rarr; Audit &rarr; Recommend

```text
[ Raw Input ]  -->  [ Claude Sonnet Parser ]  -->  [ Deterministic Rules ]  -->  [ Action Recommendation ]
Bank CSV /           Normalized Merchants          Unused >60d, Overlaps,        "Cancel via PayPal now
Receipt Text         ISO-8601 Charge Dates         Trial Ending <=3d             to save $270/year"
```

### Deterministic safety for money logic. Generative intelligence for messy human inputs.

> **Speaker Notes (1:00 – 1:20)**:  
> "Here is our AI architecture. We don't let an LLM hallucinate financial numbers. We use Claude Sonnet to parse unstructured, messy text into strict Pydantic schemas. Then, our deterministic rules engine detects category overlaps, price hikes, and expiring trials. Finally, Claude formulates a 20-word, number-backed justification for every suggested action."

---

## Slide 5: PayPal Integration & Safety

# The Power of PayPal.
### Real recurring control through the PayPal Subscriptions API. User confirmation is mandatory.

* **Direct API Control**: `POST /v1/billing/subscriptions/{id}/suspend` and `/cancel`.
* **Zero Disruption**: Pause during off-months; restore with 1-tap undo.
* **Human-in-the-Loop**: The AI never cancels without explicit biometric/click approval.

> **Speaker Notes (1:20 – 1:40)**:  
> "Unlike apps that ask for your banking passwords or send fake cancellation letters, Churn Guard integrates directly with PayPal’s Subscriptions API. We execute real `suspend` and `cancel` calls in the PayPal sandbox. It puts the consumer back in the driver's seat: you review the AI’s recommendation, click once, and PayPal cuts the payment at the source."

---

## Slide 6: The Impact

# $3,840.00 Saved.
### On our single demo user wallet, Churn Guard recovered $3,840/year without sacrificing lifestyle utility.

* **Equinox (94 days inactive)**: **+$3,360/yr** (Paused)
* **PixelPro (Expiring trial)**: **+$270/yr** (Cancelled)
* **Apple Music (Overlaps Spotify)**: **+$132/yr** (Cancelled)
* **Netflix (Price increase)**: **+$30/yr** (Downgraded tier)

> **Speaker Notes (1:40 – 2:00)**:  
> "The financial impact is immediate. In our demo wallet of 14 subscriptions, Churn Guard identified 5 high-impact leaks. By pausing the unused gym, cancelling the duplicate music app, and stopping the free trial trap, this user keeps nearly $4,000 every single year. It pays for itself on day one."

---

## Slide 7: What's Next & The Team

# Keep What You Earned.
### Coming next: Real-time PayPal Webhook alerts, team/family wallet sharing, and merchant negotiation.

* **Person A (Frontend)**: React, Three.js 3D visualization, Tailwind design system.
* **Person B (Backend & PayPal)**: FastAPI, PayPal Subscriptions v1 REST API, OAuth.
* **Person C (AI & Data)**: Claude parser, deterministic audit engine, alerts pipeline.

### *"Churn Guard: Stop paying for what you forgot."*

> **Speaker Notes (2:00 – 2:20)**:  
> "We are team Churn Guard: Person A built the responsive React and Three.js frontend; Person B built the PayPal Subscriptions backend; and I built the AI parser, audit, and alerts engine. Coming up, we're building real-time webhook listeners to catch stealth charges before they clear. Thank you, and we'd love to answer your questions!"
