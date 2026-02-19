from decimal import Decimal

from django.db.models import Sum
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Job, Profile, Message, Payment
from .serializers import (
    JobSerializer,
    ProfileSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    UserSerializer,
    MessageSerializer,
    PaymentSerializer,
    DashboardSummarySerializer,
)


User = get_user_model()


class JobListCreateView(generics.ListCreateAPIView):
    queryset = Job.objects.all().order_by("-created_at")
    serializer_class = JobSerializer
    permission_classes = [AllowAny]


class ProfileDetailView(generics.RetrieveUpdateAPIView):
    queryset = Profile.objects.select_related("user").all()
    serializer_class = ProfileSerializer
    permission_classes = [AllowAny]


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register
    """

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login
    """

    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class RefreshTokenView(TokenRefreshView):
    """
    POST /api/auth/token/refresh
    """

    permission_classes = [AllowAny]


class LogoutView(APIView):
    """
    POST /api/auth/logout
    Body: { "refresh": "<token>" }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(generics.RetrieveAPIView):
    """
    GET /api/auth/me
    """

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class DashboardSummaryView(APIView):
    """
    GET /api/dashboard/summary
    """

    permission_classes = [AllowAny]

    def get(self, request):
        active_projects = Job.objects.count()
        # For now, treat 0 as placeholder for pending proposals and hired freelancers
        pending_proposals = 0
        hired_freelancers = Profile.objects.count()

        total_spent = (
            Payment.objects.filter(status="completed").aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0")
        )

        data = {
            "active_projects": active_projects,
            "pending_proposals": pending_proposals,
            "total_spent": total_spent,
            "hired_freelancers": hired_freelancers,
        }
        serializer = DashboardSummarySerializer(data)
        return Response(serializer.data)


class DashboardJobsView(generics.ListAPIView):
    """
    GET /api/dashboard/jobs
    Returns recent jobs for dashboard "My Jobs".
    """

    serializer_class = JobSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Job.objects.all().order_by("-created_at")[:3]


class DashboardMessagesView(generics.ListAPIView):
    """
    GET /api/dashboard/messages
    """

    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            Message.objects.filter(receiver=user)
            .select_related("sender")
            .order_by("-created_at")[:3]
        )


class MessageThreadListView(generics.ListAPIView):
    """
    GET /api/messages/threads
    Simple list of latest messages per sender for the left panel.
    """

    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            Message.objects.filter(receiver=user)
            .select_related("sender")
            .order_by("-created_at")
        )


class MessageListCreateView(generics.ListCreateAPIView):
    """
    GET /api/messages/   (all messages for current user)
    POST /api/messages/  (send message)
    """

    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(receiver=user).select_related("sender")

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class PaymentSummaryView(APIView):
    """
    GET /api/payments/summary
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = Payment.objects.filter(user=user)

        total_spent = (
            qs.filter(status="completed").aggregate(total=Sum("amount"))["total"]
            or Decimal("0")
        )
        in_escrow = (
            qs.filter(status="escrow").aggregate(total=Sum("amount"))["total"]
            or Decimal("0")
        )
        pending = (
            qs.filter(status="pending").aggregate(total=Sum("amount"))["total"]
            or Decimal("0")
        )

        return Response(
            {
                "total_spent": total_spent,
                "in_escrow": in_escrow,
                "pending": pending,
            }
        )


class PaymentTransactionListView(generics.ListAPIView):
    """
    GET /api/payments/transactions
    """

    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)

