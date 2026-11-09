"""
ai/models.py
Shared Pydantic data models for Churn Guard (Person C).

Defines the exact contract agreed upon across Person A (Frontend),
Person B (Backend & PayPal Sandbox), and Person C (AI & Analytics).
"""

from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, Field

# Core shared domain enums
Category = Literal["music", "video", "software", "fitness", "news", "cloud", "other"]
BillingCycle = Literal["monthly", "yearly", "weekly"]
Status = Literal["active", "trial", "paused", "cancelled"]
Source = Literal["paypal", "bank", "pasted", "manual"]
FindingType = Literal[
    "unused",
    "category_overlap",
    "duplicate_merchant",
    "price_increase",
    "trial_ending",
    "yearly_renewal"
]
Severity = Literal["low", "med", "high"]
Action = Literal["pause", "downgrade", "cancel", "keep"]


class Subscription(BaseModel):
    """
    Standard subscription contract shared across frontend, backend, and AI.
    All date fields follow ISO 8601 YYYY-MM-DD.
    """
    id: str
    name: str
    merchant: str
    category: Category
    amount: float = Field(gt=0, description="Cost per recurring billing cycle")
    currency: str = Field(default="USD", description="3-letter currency code")
    billing_cycle: BillingCycle
    next_charge_date: date
    status: Status
    trial_end_date: Optional[date] = None
    previous_amount: Optional[float] = None
    last_used_date: Optional[date] = None
    source: Source
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0)


class Finding(BaseModel):
    """
    Audit finding representing an inefficiency, waste flag, or upcoming risk.
    """
    id: str
    type: FindingType
    severity: Severity
    subscription_ids: list[str]
    monthly_savings_estimate: float = Field(ge=0.0)
    description: str


class Recommendation(BaseModel):
    """
    Actionable recommendation produced by Claude with fallback logic.
    """
    action: Action
    reason: str = Field(description="Plain English, max 25 words with specific numbers")
    confidence: float = Field(ge=0.0, le=1.0)
    monthly_savings: float = 0.0


class Summary(BaseModel):
    """
    High-level dashboard financial headline and total estimated yearly savings.
    """
    total_yearly_savings: float
    headline: str
    findings_count: int


class Alert(BaseModel):
    """
    Prioritized notification for Person A's UI buttons and alert feed.
    """
    id: str
    title: str
    body: str
    due_date: Optional[date] = None
    urgency: Severity
    suggested_action: Action
    subscription_id: str
