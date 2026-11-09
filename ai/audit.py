"""
ai/audit.py
Audit engine for Churn Guard (Person C).

Implements deterministic rules (zero LLM dependency) to detect:
1. Unused subscriptions (> 60 days of inactivity)
2. Category overlaps (e.g. 2 active music or video streaming apps)
3. Duplicate merchant accounts
4. Hidden price increases (previous_amount < current amount)
5. Free trials expiring within 3 days
6. Large yearly renewals charging within 7 days
"""

from collections import defaultdict
from datetime import date
from typing import Optional

from ai.models import Finding, FindingType, Severity, Subscription


def _monthly_cost(sub: Subscription) -> float:
    """Normalizes subscription cost to a monthly figure."""
    if sub.billing_cycle == "yearly":
        return round(sub.amount / 12.0, 2)
    elif sub.billing_cycle == "weekly":
        return round(sub.amount * 4.33, 2)
    return round(sub.amount, 2)


def audit(subscriptions: list[Subscription], today: Optional[date] = None) -> list[Finding]:
    """
    Runs deterministic audit rules against active and trial subscriptions.
    Returns a list of findings with severity ratings and estimated monthly savings.
    """
    ref_date = today or date(2026, 11, 9)
    findings: list[Finding] = []
    finding_counter = 1

    active_subs = [s for s in subscriptions if s.status in ("active", "trial")]

    # Rule 1: Duplicate Merchant Accounts
    merchant_map: dict[str, list[Subscription]] = defaultdict(list)
    for sub in active_subs:
        merchant_map[sub.merchant.lower().strip()].append(sub)

    for merchant_name, subs in merchant_map.items():
        if len(subs) > 1:
            duplicate_savings = sum(_monthly_cost(s) for s in subs[1:])
            findings.append(
                Finding(
                    id=f"find-{finding_counter}",
                    type="duplicate_merchant",
                    severity="high",
                    subscription_ids=[s.id for s in subs],
                    monthly_savings_estimate=duplicate_savings,
                    description=f"Duplicate active subscriptions found for merchant '{subs[0].merchant}'."
                )
            )
            finding_counter += 1

    # Rule 2: Category Overlap (e.g. 2 music or 2 video apps)
    category_map: dict[str, list[Subscription]] = defaultdict(list)
    for sub in active_subs:
        if sub.category in ("music", "video", "cloud", "fitness"):
            category_map[sub.category].append(sub)

    for cat, subs in category_map.items():
        if len(subs) > 1:
            # First subscription is assumed preferred; others are flagged as overlap waste
            overlap_subs = subs[1:]
            overlap_savings = sum(_monthly_cost(s) for s in overlap_subs)
            app_names = ", ".join(s.name for s in subs)
            findings.append(
                Finding(
                    id=f"find-{finding_counter}",
                    type="category_overlap",
                    severity="med",
                    subscription_ids=[s.id for s in subs],
                    monthly_savings_estimate=overlap_savings,
                    description=f"Category overlap in '{cat}': multiple active services detected ({app_names})."
                )
            )
            finding_counter += 1

    for sub in active_subs:
        m_cost = _monthly_cost(sub)

        # Rule 3: Trial Ending in <= 3 Days
        if sub.trial_end_date:
            days_until_trial_end = (sub.trial_end_date - ref_date).days
            if 0 <= days_until_trial_end <= 3:
                findings.append(
                    Finding(
                        id=f"find-{finding_counter}",
                        type="trial_ending",
                        severity="high",
                        subscription_ids=[sub.id],
                        monthly_savings_estimate=m_cost,
                        description=f"Free trial for '{sub.name}' ends in {days_until_trial_end} days on {sub.trial_end_date}. Auto-converts to ${sub.amount:.2f}."
                    )
                )
                finding_counter += 1

        # Rule 4: Price Increase Detected
        if sub.previous_amount is not None and sub.amount > sub.previous_amount:
            diff = round(sub.amount - sub.previous_amount, 2)
            findings.append(
                Finding(
                    id=f"find-{finding_counter}",
                    type="price_increase",
                    severity="med",
                    subscription_ids=[sub.id],
                    monthly_savings_estimate=diff,
                    description=f"'{sub.name}' increased in price from ${sub.previous_amount:.2f} to ${sub.amount:.2f} (+${diff:.2f}/mo)."
                )
            )
            finding_counter += 1

        # Rule 5: Unused > 60 Days
        if sub.last_used_date:
            inactive_days = (ref_date - sub.last_used_date).days
            if inactive_days > 60:
                severity: Severity = "high" if inactive_days >= 90 or m_cost >= 50 else "med"
                findings.append(
                    Finding(
                        id=f"find-{finding_counter}",
                        type="unused",
                        severity=severity,
                        subscription_ids=[sub.id],
                        monthly_savings_estimate=m_cost,
                        description=f"'{sub.name}' has had zero recorded activity in {inactive_days} days."
                    )
                )
                finding_counter += 1

        # Rule 6: Yearly Renewal Charging in <= 7 Days
        if sub.billing_cycle == "yearly":
            days_until_renewal = (sub.next_charge_date - ref_date).days
            if 0 <= days_until_renewal <= 7:
                findings.append(
                    Finding(
                        id=f"find-{finding_counter}",
                        type="yearly_renewal",
                        severity="high",
                        subscription_ids=[sub.id],
                        monthly_savings_estimate=m_cost,
                        description=f"Large annual renewal for '{sub.name}' (${sub.amount:.2f}/yr) charges in {days_until_renewal} days on {sub.next_charge_date}."
                    )
                )
                finding_counter += 1

    return findings
