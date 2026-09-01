import hashlib
import hmac
import logging

import environ

from django.conf import settings

env = environ.Env()
logger = logging.getLogger(__name__)


def get_razorpay_client():
    try:
        import razorpay
    except ImportError:
        return None
    key_id = env("RAZORPAY_KEY_ID", default=getattr(settings, "RAZORPAY_KEY_ID", ""))
    key_secret = env("RAZORPAY_KEY_SECRET", default=getattr(settings, "RAZORPAY_KEY_SECRET", ""))
    if not key_id or not key_secret:
        return None
    return razorpay.Client(auth=(key_id, key_secret))


def create_razorpay_order(amount_paise: int, currency: str = "INR", receipt: str | None = None) -> dict:
    client = get_razorpay_client()
    if client is None:
        raise ValueError("Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.")
    order = client.order.create(
        {"amount": amount_paise, "currency": currency, "receipt": receipt or f"receipt_{amount_paise}", "payment_capture": 1}
    )
    return order


def verify_signature(order_id: str, payment_id: str, signature: str) -> bool:
    key_secret = env("RAZORPAY_KEY_SECRET", default=getattr(settings, "RAZORPAY_KEY_SECRET", ""))
    if not key_secret:
        return False
    payload = f"{order_id}|{payment_id}"
    expected = hmac.new(key_secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
