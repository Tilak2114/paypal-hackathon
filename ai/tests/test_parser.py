"""
ai/tests/test_parser.py
Tests for parsing raw bank CSVs, PayPal exports, and receipt email text.
"""

from datetime import date
from ai.parser import parse_subscriptions


def test_parse_bank_statement_csv(raw_bank_csv: str, today: date):
    """
    Parses messy bank CSV containing normalized transactions like
    'ADOBE *CREATIVE CLOUD', 'APPLE.COM/BILL', 'EQUINOX FITNESS'.
    """
    subs = parse_subscriptions(raw_bank_csv, today)
    assert 6 <= len(subs) <= 8

    names = {s.merchant for s in subs}
    assert "Adobe" in names
    assert "Apple" in names
    assert "Equinox" in names
    assert "Spotify" in names

    for s in subs:
        assert s.amount > 0
        assert s.source == "bank"
        assert s.category in ("music", "video", "software", "fitness", "news", "cloud", "other")


def test_parse_paypal_export_csv(raw_paypal_csv: str, today: date):
    """
    Parses messy PayPal CSV containing preapproved payments like
    'NFLX*STREAMING NETFLIX.COM', 'OpenAI, LLC', 'Disney Streaming Services'.
    """
    subs = parse_subscriptions(raw_paypal_csv, today)
    assert 6 <= len(subs) <= 8

    names = {s.merchant for s in subs}
    assert "Netflix" in names
    assert "OpenAI" in names
    assert "Disney" in names

    for s in subs:
        assert s.amount > 0
        assert s.source == "paypal"


def test_parse_receipt_emails_text(raw_receipt_emails: str, today: date):
    """
    Parses messy pasted email receipt block containing notices for
    trials, price increases, annual renewals, and receipts.
    """
    subs = parse_subscriptions(raw_receipt_emails, today)
    assert 6 <= len(subs) <= 8

    names = {s.merchant for s in subs}
    assert "PixelPro" in names
    assert "Amazon" in names
    assert "Netflix" in names

    pixelpro = next(s for s in subs if s.merchant == "PixelPro")
    assert pixelpro.status == "trial"
    assert pixelpro.trial_end_date is not None
