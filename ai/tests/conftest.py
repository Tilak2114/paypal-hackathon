"""
ai/tests/conftest.py
Deterministic pytest fixtures for Churn Guard (Person C).
"""

import json
from datetime import date
from pathlib import Path
import pytest

from ai.models import Subscription

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


@pytest.fixture
def today() -> date:
    """Fixed reference date for deterministic test execution."""
    return date(2026, 11, 9)


@pytest.fixture
def sample_subscriptions() -> list[Subscription]:
    """Loads and validates the 14 sample subscriptions."""
    path = DATA_DIR / "sample_subscriptions.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return [Subscription.model_validate(item) for item in data]


@pytest.fixture
def raw_bank_csv() -> str:
    path = DATA_DIR / "raw" / "bank_statement.csv"
    return path.read_text(encoding="utf-8")


@pytest.fixture
def raw_paypal_csv() -> str:
    path = DATA_DIR / "raw" / "paypal_export.csv"
    return path.read_text(encoding="utf-8")


@pytest.fixture
def raw_receipt_emails() -> str:
    path = DATA_DIR / "raw" / "receipt_emails.txt"
    return path.read_text(encoding="utf-8")
