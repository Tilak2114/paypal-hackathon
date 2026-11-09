"""
ai/tests/test_alerts.py
Tests for alert prioritization, sorting, and UI button action mappings.
"""

from datetime import date
from ai.alerts import URGENCY_RANK, build_alerts
from ai.models import Subscription


def test_build_alerts_sorting_and_urgency(sample_subscriptions: list[Subscription], today: date):
    """
    Verifies alerts are sorted strictly by urgency (high > med > low)
    and mapped to valid suggested actions.
    """
    alerts = build_alerts(sample_subscriptions, today)
    assert len(alerts) >= 5

    # Verify urgency order is non-increasing
    urgency_values = [URGENCY_RANK[a.urgency] for a in alerts]
    assert urgency_values == sorted(urgency_values, reverse=True)

    # First alert must be high urgency (trial expiring or large unused charge)
    assert alerts[0].urgency == "high"

    # Verify action enums match Person A's button states
    for a in alerts:
        assert a.suggested_action in ("pause", "cancel", "downgrade", "keep")
        assert a.title
        assert a.body
        assert a.subscription_id


def test_trial_alert_details(sample_subscriptions: list[Subscription], today: date):
    """
    Specifically tests the PixelPro Studio trial alert details.
    """
    alerts = build_alerts(sample_subscriptions, today)
    trial_alert = next((a for a in alerts if "PixelPro" in a.title), None)

    assert trial_alert is not None
    assert trial_alert.urgency == "high"
    assert trial_alert.suggested_action == "cancel"
    assert trial_alert.due_date == date(2026, 11, 11)
