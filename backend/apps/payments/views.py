import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.courses.models import Course
from apps.enrollments.services import enroll

from .models import Payment
from .services import create_razorpay_order, get_razorpay_client, verify_signature

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_order(request):
    course_id = request.data.get("course_id")
    if not course_id:
        return Response({"data": None, "error": "course_id required"}, status=400)
    try:
        course = Course.objects.get(id=course_id, status=Course.Status.PUBLISHED)
    except Course.DoesNotExist:
        return Response({"data": None, "error": "Course not found"}, status=404)

    # free course: enroll directly, no payment needed
    if course.price == 0:
        enrollment = enroll(request.user, course)
        return Response({"data": {"free": True, "enrolled": True, "enrollment_id": enrollment.id}, "error": None})

    # already enrolled?
    from apps.enrollments.models import Enrollment

    if Enrollment.objects.filter(learner=request.user, course=course).exists():
        return Response({"data": {"already_enrolled": True}, "error": None})

    amount_paise = int(course.price * 100)
    currency = "INR"
    receipt = f"course_{course.id}_user_{request.user.id}"

    client = get_razorpay_client()
    if client is None:
        # mock order for dev without keys
        import uuid

        mock_order_id = f"order_mock_{uuid.uuid4().hex[:14]}"
        Payment.objects.create(
            user=request.user,
            course=course,
            razorpay_order_id=mock_order_id,
            amount=amount_paise,
            currency=currency,
            status=Payment.Status.CREATED,
        )
        return Response(
            {
                "data": {
                    "order_id": mock_order_id,
                    "amount": amount_paise,
                    "currency": currency,
                    "key_id": "rzp_test_mock",
                    "mock": True,
                },
                "error": None,
            }
        )

    try:
        order = create_razorpay_order(amount_paise, currency, receipt)
    except Exception as e:
        logger.exception("Razorpay order create failed")
        return Response({"data": None, "error": str(e)}, status=500)

    Payment.objects.create(
        user=request.user,
        course=course,
        razorpay_order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
        status=Payment.Status.CREATED,
    )

    import environ

    env = environ.Env()
    key_id = env("RAZORPAY_KEY_ID", default="")

    return Response(
        {"data": {"order_id": order["id"], "amount": order["amount"], "currency": order["currency"], "key_id": key_id}, "error": None}
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    order_id = request.data.get("razorpay_order_id")
    payment_id = request.data.get("razorpay_payment_id")
    signature = request.data.get("razorpay_signature")
    course_id = request.data.get("course_id")

    if not all([order_id, payment_id, signature]):
        return Response({"data": None, "error": "Missing payment fields"}, status=400)

    try:
        payment = Payment.objects.get(razorpay_order_id=order_id, user=request.user)
    except Payment.DoesNotExist:
        return Response({"data": None, "error": "Order not found"}, status=404)

    # mock order: skip signature check and enroll
    if order_id.startswith("order_mock_"):
        payment.razorpay_payment_id = payment_id
        payment.razorpay_signature = signature
        payment.status = Payment.Status.PAID
        payment.save(update_fields=["razorpay_payment_id", "razorpay_signature", "status", "updated_at"])
        enrollment = enroll(request.user, payment.course)
        return Response({"data": {"verified": True, "enrollment_id": enrollment.id, "mock": True}, "error": None})

    if not verify_signature(order_id, payment_id, signature):
        payment.status = Payment.Status.FAILED
        payment.save(update_fields=["status", "updated_at"])
        return Response({"data": None, "error": "Signature verification failed"}, status=400)

    payment.razorpay_payment_id = payment_id
    payment.razorpay_signature = signature
    payment.status = Payment.Status.PAID
    payment.save(update_fields=["razorpay_payment_id", "razorpay_signature", "status", "updated_at"])

    # ensure course_id matches if provided
    course = payment.course
    if course_id and str(course.id) != str(course_id):
        return Response({"data": None, "error": "Course mismatch"}, status=400)

    enrollment = enroll(request.user, course)
    return Response({"data": {"verified": True, "enrollment_id": enrollment.id}, "error": None})
