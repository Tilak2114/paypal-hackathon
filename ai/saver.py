"""
ai/saver.py
Recommendation and financial summary engine for Churn Guard (Person C).

Uses Claude to recommend concrete user actions (pause, cancel, downgrade, keep)
with crisp, number-backed rationales under 25 words. Includes a deterministic
rule-based fallback so demo walkthroughs never fail.
"""

import json
import os
from typing import Optional

from ai.models import Action, Finding, Recommendation, Subscription, Summary

CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-5-5")


def recommend(finding: Finding, subscription: Subscription) -> Recommendation:
    """
    Produces a targeted recommendation for a flagged subscription finding.
    Attempts Claude API first, falling back gracefully to deterministic logic.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if api_key:
        try:
            return _recommend_with_claude(finding, subscription, api_key)
        except Exception:
            pass

    return _fallback_recommend(finding, subscription)


def _recommend_with_claude(
    finding: Finding, subscription: Subscription, api_key: str
) -> Recommendation:
    """Invokes Claude for concise, contextual recommendation text."""
    import anthropic
    from ai.parser import strip_code_fences

    client = anthropic.Anthropic(api_key=api_key)
    prompt = f"""Subscription:
Name: {subscription.name}
Amount: ${subscription.amount} ({subscription.billing_cycle})
Status: {subscription.status}
Finding: {finding.type} - {finding.description}
Estimated Monthly Savings: ${finding.monthly_savings_estimate:.2f}

Recommend one action: "pause", "downgrade", "cancel", or "keep".
Write a plain-English reason of AT MOST 25 words citing exact dollar figures.

Return ONLY valid JSON:
{{
  "action": "pause" | "downgrade" | "cancel" | "keep",
  "reason": "string (under 25 words)",
  "confidence": 0.95
}}
"""

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=256,
        temperature=0.0,
        messages=[{"role": "user", "content": prompt}]
    )

    cleaned = strip_code_fences(response.content[0].text)
    data = json.loads(cleaned)

    annual_saving = round(finding.monthly_savings_estimate, 2)
    return Recommendation(
        action=data.get("action", "cancel"),
        reason=data.get("reason", f"Cancel via PayPal to save ${annual_saving * 12:.0f}/year."),
        confidence=float(data.get("confidence", 0.9)),
        monthly_savings=annual_saving
    )


def _fallback_recommend(finding: Finding, subscription: Subscription) -> Recommendation:
    """
    Deterministic rule-based fallback recommendation generator.
    Guarantees < 25 words plain English with specific dollar numbers.
    """
    m_cost = finding.monthly_savings_estimate
    yr_savings = round(m_cost * 12.0)

    if finding.type == "trial_ending":
        return Recommendation(
            action="cancel",
            reason=f"Trial converts soon to ${subscription.amount:.2f}/mo. Cancel via PayPal now to save ${yr_savings}/yr.",
            confidence=0.98,
            monthly_savings=m_cost
        )

    if finding.type == "unused":
        if subscription.amount >= 100:
            return Recommendation(
                action="pause",
                reason=f"Unused in over 60 days. Pause recurring ${subscription.amount:.2f} billing to save ${yr_savings}/yr.",
                confidence=0.96,
                monthly_savings=m_cost
            )
        return Recommendation(
            action="cancel",
            reason=f"No activity recorded in months. Cancel with one tap to save ${yr_savings} every year.",
            confidence=0.95,
            monthly_savings=m_cost
        )

    if finding.type == "category_overlap":
        return Recommendation(
            action="cancel",
            reason=f"You have overlapping streaming services. Cancel this duplicate to save ${yr_savings}/year.",
            confidence=0.92,
            monthly_savings=m_cost
        )

    if finding.type == "price_increase":
        diff = round(subscription.amount - (subscription.previous_amount or 0), 2)
        return Recommendation(
            action="downgrade",
            reason=f"Price jumped by ${diff:.2f}/mo. Downgrade your tier or cancel to retain ${yr_savings}/yr.",
            confidence=0.90,
            monthly_savings=m_cost
        )

    if finding.type == "yearly_renewal":
        return Recommendation(
            action="cancel",
            reason=f"Renews in days for ${subscription.amount:.2f}. Cancel now to avoid the full yearly charge.",
            confidence=0.94,
            monthly_savings=m_cost
        )

    return Recommendation(
        action="keep",
        reason="Active service within expected usage bounds.",
        confidence=0.85,
        monthly_savings=0.0
    )


def summarize(findings: list[Finding]) -> Summary:
    """
    Computes total projected yearly savings and a single-sentence punchy
    headline for Person A's dashboard hero.
    """
    # Prevent double-counting savings across overlapping findings
    counted_sub_ids: set[str] = set()
    total_monthly = 0.0

    for f in findings:
        for sid in f.subscription_ids:
            if sid not in counted_sub_ids:
                counted_sub_ids.add(sid)
                total_monthly += f.monthly_savings_estimate

    total_yearly = round(total_monthly * 12.0, 2)
    count = len(findings)

    if count == 0:
        headline = "Audit clean! No forgotten subscriptions or waste detected."
    elif total_yearly > 1000:
        headline = f"Found {count} subscription leaks: recover ${total_yearly:,.0f}/year with one tap."
    else:
        headline = f"Found {count} subscription alerts: recover ${total_yearly:,.0f}/year."

    return Summary(
        total_yearly_savings=total_yearly,
        headline=headline,
        findings_count=count
    )
