from rest_framework import serializers

from apps.courses.serializers import CourseListSerializer

from .models import Payment


class PackBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    price = serializers.DecimalField(max_digits=7, decimal_places=2)


class PaymentSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    pack = PackBriefSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = (
            "id",
            "course",
            "pack",
            "razorpay_order_id",
            "razorpay_payment_id",
            "amount",
            "currency",
            "status",
            "created_at",
            "updated_at",
        )
