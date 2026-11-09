"""
ai/alerts.py
Alert notification builder for Churn Guard (Person C).

Transforms audit findings into prioritized, action-ready Alert cards
specifically formatted for Person A's frontend action buttons.
"""

from datetime import date
from typing import Optional

from ai.audit import audit
from ai.models import Action, Alert, Severity, Subscription

URGENCY_RANK: dict[Severity, int] = {
    "high": 3,
    "med": 2,
    "low": 1
}


def build_alerts(subscriptions: list[Subscription], today: Optional[date] = None) -> list[Alert]:
    """
    Evaluates subscriptions and produces sorted, actionable alerts.
    Sorted primarily by urgency (high > med > low) and secondarily by due_date.
    """
    ref_date = today or date(2026, 11, 9)
    findings = audit(subscriptions, ref_date)
    sub_map = {s.id: s for s in subscriptions}

    alerts: list[Alert] = []
    alert_counter = 1

    for finding in findings:
        primary_sub_id = finding.subscription_ids[0]
        sub = sub_map.get(primary_sub_id)
        if not sub:
            continue

        title: str
        body: str
        due_date: Optional[date]
        suggested_action: Action

        if finding.type == "trial_ending":
            days = (sub.trial_end_date - ref_date).days if sub.trial_end_date else 0
            title = f"Free Trial Expiring: {sub.name}"
            body = f"Ends in {days} day{'s' if days != 1 else ''}. Converts to recurring ${sub.amount:.2f}/mo."
            due_date = sub.trial_end_date
            suggested_action = "cancel"

        elif finding.type == "yearly_renewal":
            days = (sub.next_charge_date - ref_date).days
            title = f"Upcoming Yearly Charge: {sub.name}"
            body = f"${sub.amount:.2f}/yr charges in {days} days on {sub.next_charge_date.isoformat()}."
            due_date = sub.next_charge_date
            suggested_action = "cancel"

        elif finding.type == "price_increase":
            diff = round(sub.amount - (sub.previous_amount or 0), 2)
            title = f"Price Increase: {sub.name}"
            body = f"Rate increased from ${sub.previous_amount:.2f} to ${sub.amount:.2f} (+${diff:.2f}/mo)."
            due_date = sub.next_charge_date
            suggested_action = "downgrade"

        elif finding.type == "unused":
            days = (ref_date - sub.last_used_date).days if sub.last_used_date else 60
            title = f"Zero Usage: {sub.name}"
            body = f"No activity in {days} days. Wasting ${sub.amount:.2f}/mo."
            due_date = sub.next_charge_date
            suggested_action = "pause" if sub.amount >= 100 else "cancel"

        elif finding.type == "category_overlap":
            other_names = [sub_map[sid].name for sid in finding.subscription_ids[1:] if sid in sub_map]
            overlaps = ", ".join(other_names) if other_names else "other services"
            title = f"Duplicate {sub.category.capitalize()} App: {sub.name}"
            body = f"Overlaps with {overlaps}. Consolidate to eliminate duplicate charges."
            due_date = sub.next_charge_date
            suggested_action = "cancel"

        else:
            title = f"Review Subscription: {sub.name}"
            body = finding.description
            due_date = sub.next_charge_date
            suggested_action = "keep"

        alerts.append(
            Alert(
                id=f"alert-{alert_counter}",
                title=title,
                body=body,
                due_date=due_date,
                urgency=finding.severity,
                suggested_action=suggested_action,
                subscription_id=sub.id
            )
        )
        alert_counter += 1

    # Sort: highest urgency first (high > med > low), then nearest due_date
    def sort_key(a: Alert):
        rank = -URGENCY_RANK.get(a.urgency, 0)
        due = a.due_date or date(2099, 12, 31)
        return (rank, due)

    alerts.sort(key=sort_key)
    return alerts
