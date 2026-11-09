"""
ai/router.py
FastAPI router for Churn Guard (Person C).

Person B can mount this in their FastAPI backend with a single line:
    app.include_router(ai_router)
"""

from datetime import date
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

from ai.alerts import build_alerts
from ai.audit import audit
from ai.models import Alert, Finding, Recommendation, Subscription, Summary
from ai.parser import parse_subscriptions
from ai.saver import recommend, summarize

ai_router = APIRouter(prefix="/ai", tags=["AI Engine (Person C)"])


class ParseRequest(BaseModel):
    raw_text: str
    today: Optional[date] = None


class AuditRequest(BaseModel):
    subscriptions: list[Subscription]
    today: Optional[date] = None


class AlertsRequest(BaseModel):
    subscriptions: list[Subscription]
    today: Optional[date] = None


class RecommendRequest(BaseModel):
    finding: Finding
    subscription: Subscription


class SummarizeRequest(BaseModel):
    findings: list[Finding]


@ai_router.post("/parse", response_model=list[Subscription])
def api_parse(req: ParseRequest) -> list[Subscription]:
    """Parses raw text/CSV into standardized Subscription objects."""
    return parse_subscriptions(req.raw_text, req.today)


@ai_router.post("/audit", response_model=list[Finding])
def api_audit(req: AuditRequest) -> list[Finding]:
    """Runs deterministic audit rules returning inefficiencies and savings."""
    return audit(req.subscriptions, req.today)


@ai_router.post("/alerts", response_model=list[Alert])
def api_alerts(req: AlertsRequest) -> list[Alert]:
    """Produces prioritized action alerts sorted by urgency and due date."""
    return build_alerts(req.subscriptions, req.today)


@ai_router.post("/recommend", response_model=Recommendation)
def api_recommend(req: RecommendRequest) -> Recommendation:
    """Generates an actionable recommendation (< 25 words) for a finding."""
    return recommend(req.finding, req.subscription)


@ai_router.post("/summarize", response_model=Summary)
def api_summarize(req: SummarizeRequest) -> Summary:
    """Calculates total yearly savings and a single-sentence dashboard headline."""
    return summarize(req.findings)
