import pytest


@pytest.fixture(autouse=True)
def _test_defaults(settings, monkeypatch):
    # Django forces DEBUG=False under test, which would hide the OTP
    # mock_code the suite reads from send-otp responses.
    settings.DEBUG = True
    # The suite exercises mock payments; real keys from a local .env
    # would otherwise push order creation down the live path
    # (services read os.environ, not just Django settings).
    monkeypatch.setenv("RAZORPAY_KEY_ID", "")
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "")
    settings.RAZORPAY_KEY_ID = ""
    settings.RAZORPAY_KEY_SECRET = ""
