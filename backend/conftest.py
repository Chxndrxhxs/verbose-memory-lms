import pytest


@pytest.fixture(autouse=True)
def _relax_throttles(settings):
    rates = dict(settings.REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES", {}))
    rates.update(
        {
            "anon": "10000/day",
            "user": "10000/day",
            "send_otp": "1000/hour",
            "verify_otp": "1000/hour",
        }
    )
    settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = rates
