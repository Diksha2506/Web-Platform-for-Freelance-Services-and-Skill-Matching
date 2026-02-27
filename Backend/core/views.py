from decimal import Decimal

from django.db.models import Sum
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.utils import timezone
from datetime import timedelta

from .models import Job, Profile, Message, Payment, Project, Task, Meeting, SupportRequest
from .serializers import (
    JobSerializer,
    ProfileSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    UserSerializer,
    MessageSerializer,
    PaymentSerializer,
    DashboardSummarySerializer,
    ProjectSerializer,
    TaskSerializer,
    MeetingSerializer,
    SupportRequestSerializer,
)


User = get_user_model()


class JobListCreateView(generics.ListCreateAPIView):
    queryset = Job.objects.all().order_by("-created_at")
    serializer_class = JobSerializer
    permission_classes = [AllowAny]
    
    def perform_create(self, serializer):
        # Associate job with logged-in user if authenticated
        if self.request.user.is_authenticated:
            serializer.save(posted_by=self.request.user)
        else:
            serializer.save()


class ProfileDetailView(generics.RetrieveUpdateAPIView):
    queryset = Profile.objects.select_related("user").all()
    serializer_class = ProfileSerializer
    permission_classes = [AllowAny]


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register
    Creates user and returns minimal response. For clients we attempt auto-login and set HttpOnly cookies.
    """

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        resp = super().create(request, *args, **kwargs)
        # resp.data contains created user representation (username/email)
        role = request.data.get("role")
        username = request.data.get("username")
        password = request.data.get("password")

        # If client, create tokens and set cookies so frontend doesn't need localStorage
        if role == "client":
            try:
                user = User.objects.get(username=username)
                refresh = RefreshToken.for_user(user)
                access = refresh.access_token

                response = Response({"detail": "registered"}, status=status.HTTP_201_CREATED)
                # set cookies
                # Access token cookie (short lived)
                response.set_cookie(
                    key="access",
                    value=str(access),
                    httponly=True,
                    secure=False,
                    samesite="Lax",
                    max_age=60 * 15,
                )
                # Refresh token cookie (longer lived)
                response.set_cookie(
                    key="refresh",
                    value=str(refresh),
                    httponly=True,
                    secure=False,
                    samesite="Lax",
                    max_age=60 * 60 * 24,
                )
                return response
            except Exception:
                pass

        return resp


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login
    Returns tokens and sets HttpOnly cookies when successful.
    """

    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.user
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        data = {
            "user": {"id": user.id, "username": user.username, "email": user.email},
            "access": str(access),
            "refresh": str(refresh),
        }

        response = Response(data, status=status.HTTP_200_OK)
        # set tokens as HttpOnly cookies
        response.set_cookie(
            key="access",
            value=str(access),
            httponly=True,
            secure=False,
            samesite="Lax",
            max_age=60 * 15,
        )
        response.set_cookie(
            key="refresh",
            value=str(refresh),
            httponly=True,
            secure=False,
            samesite="Lax",
            max_age=60 * 60 * 24,
        )

        return response


class RefreshTokenView(TokenRefreshView):
    """
    POST /api/auth/token/refresh
    Refreshes tokens and updates cookies when successful.
    """

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        # prefer refresh from cookie
        refresh_token = request.COOKIES.get("refresh") or request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token required."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data={"refresh": refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        access = serializer.validated_data.get("access")
        response = Response({"access": access}, status=status.HTTP_200_OK)
        response.set_cookie(
            key="access",
            value=access,
            httponly=True,
            secure=False,
            samesite="Lax",
            max_age=60 * 15,
        )
        return response


class LogoutView(APIView):
    """
    POST /api/auth/logout
    Blacklist the refresh token (if provided) and clear auth cookies.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # try to get refresh from cookie first
        refresh_token = request.COOKIES.get("refresh") or request.data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        response = Response({"detail": "logged out"}, status=status.HTTP_200_OK)
        # clear cookies
        response.delete_cookie("access")
        response.delete_cookie("refresh")
        return response


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


class ProjectListCreateView(generics.ListCreateAPIView):
    queryset = Project.objects.all().order_by("-created_at")
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(client=self.request.user)
        else:
            serializer.save()

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Project.objects.filter(client=self.request.user).order_by("-created_at")
        return Project.objects.all().order_by("-created_at")


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]


class TaskCreateView(generics.CreateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [AllowAny]


class MeetingListCreateView(generics.ListCreateAPIView):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
    permission_classes = [AllowAny]


class FreelancerListView(generics.ListAPIView):
    queryset = Profile.objects.filter(role="freelancer")
    serializer_class = ProfileSerializer
    permission_classes = [AllowAny]


class SupportRequestCreateView(generics.CreateAPIView):
    queryset = SupportRequest.objects.all()
    serializer_class = SupportRequestSerializer
    permission_classes = [AllowAny]
