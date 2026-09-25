import logging

from django.conf import settings

from .models import OTP

logger = logging.getLogger(__name__)


def send_otp(mobile: str) -> OTP:
    # Local/dev uses a fixed code so testers never miss the toast; prod stays random.
    otp = OTP.create_for(mobile, code="1234" if settings.DEBUG else None)
    logger.info("OTP sent to %s: %s (mock)", mobile, otp.code)
    return otp
