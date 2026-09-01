import logging

from .models import OTP

logger = logging.getLogger(__name__)


def send_otp(mobile: str) -> OTP:
    otp = OTP.create_for(mobile)
    logger.info("OTP sent to %s: %s (mock)", mobile, otp.code)
    return otp
