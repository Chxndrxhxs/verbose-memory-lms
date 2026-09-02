from rest_framework import serializers

from apps.courses.serializers import CourseListSerializer

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = (
            "id",
            "course",
            "razorpay_order_id",
            "razorpay_payment_id",
            "amount",
            "currency",
            "status",
            "created_at",
            "updated_at",
        )
