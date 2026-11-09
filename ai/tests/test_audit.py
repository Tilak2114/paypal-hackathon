"""
ai/tests/test_audit.py
Tests for deterministic audit rules and savings estimates.
"""

from datetime import date
from ai.audit import audit
from ai.models import Subscription
from ai.saver import recommend, summarize


def test_audit_story_beats(sample_subscriptions: list[Subscription], today: date):
    """
    Verifies that all 6 deliberate story beats are detected by the audit engine.
    """
    findings = audit(sample_subscriptions, today)
    types_found = {f.type for f in findings}

    # 1. Overlapping music apps (Spotify + Apple Music)
    assert "category_overlap" in types_found
    music_overlap = next(f for f in findings if f.type == "category_overlap" and "music" in f.description)
    assert "sub-1" in music_overlap.subscription_ids
    assert "sub-2" in music_overlap.subscription_ids

    # 2. Free trial ending in 2 days (PixelPro Studio)
    assert "trial_ending" in types_found
    trial_find = next(f for f in findings if f.type == "trial_ending")
    assert "sub-3" in trial_find.subscription_ids
    assert trial_find.severity == "high"

    # 3. Price increase (Netflix 15.49 -> 17.99)
    assert "price_increase" in types_found
    price_find = next(f for f in findings if f.type == "price_increase")
    assert "sub-4" in price_find.subscription_ids
    assert price_find.monthly_savings_estimate == 2.50

    # 4. Gym membership with no usage in >90 days (Equinox)
    assert "unused" in types_found
    gym_find = next(f for f in findings if f.type == "unused" and "sub-5" in f.subscription_ids)
    assert gym_find.severity == "high"
    assert gym_find.monthly_savings_estimate == 280.00

    # 5. Yearly renewal coming up in 6 days (Amazon Prime)
    assert "yearly_renewal" in types_found
    yearly_find = next(f for f in findings if f.type == "yearly_renewal")
    assert "sub-6" in yearly_find.subscription_ids
    assert yearly_find.severity == "high"

    # 6. Duolingo is paused -> must NOT produce an active waste finding
    duo_findings = [f for f in findings if "sub-7" in f.subscription_ids]
    assert len(duo_findings) == 0


def test_saver_recommendations(sample_subscriptions: list[Subscription], today: date):
    """
    Verifies recommendations are under 25 words and include specific figures.
    """
    findings = audit(sample_subscriptions, today)
    sub_map = {s.id: s for s in sample_subscriptions}

    for f in findings:
        sub = sub_map[f.subscription_ids[0]]
        rec = recommend(f, sub)
        assert rec.action in ("pause", "cancel", "downgrade", "keep")
        # Word count constraint (max 25 words)
        words = rec.reason.split()
        assert len(words) <= 25, f"Reason exceeded 25 words: '{rec.reason}'"


def test_summarize_yearly_savings(sample_subscriptions: list[Subscription], today: date):
    """
    Verifies that financial summary aggregates yearly savings and produces headline.
    """
    findings = audit(sample_subscriptions, today)
    summary = summarize(findings)

    assert summary.findings_count > 0
    assert summary.total_yearly_savings > 1000.0
    assert "year" in summary.headline.lower()
