from decimal import Decimal

from django.db.models import Sum, Max
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.utils import timezone
from datetime import timedelta

from .models import Job, Profile, Message, Payment, Project, Task, Meeting, SupportRequest, Proposal, Review
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
    ProposalSerializer,
    ReviewSerializer,
)


User = get_user_model()


class JobListCreateView(generics.ListCreateAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ['job_type', 'experience_level', 'is_active', 'category']
    search_fields = ['title', 'description', 'skills_required']
    ordering_fields = ['created_at', 'budget']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Job.objects.all().order_by("-created_at")
        user = self.request.user
        mine = self.request.query_params.get('mine')
        
        if mine == 'true' and user.is_authenticated:
            return queryset.filter(posted_by=user)
        return queryset
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(posted_by=self.request.user)
        else:
            serializer.save()


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


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
        username = request.data.get("username")
        password = request.data.get("password")

        # Auto-login after registration
        try:
            user = User.objects.get(username=username)
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token

            user_role = getattr(user.profile, 'role', 'freelancer') if hasattr(user, 'profile') else 'freelancer'
            response = Response({"detail": "registered", "user": {"username": user.username, "email": user.email, "role": user_role}}, status=status.HTTP_201_CREATED)
            # set cookies
            response.set_cookie(
                key="access",
                value=str(access),
                httponly=True,
                secure=False, # Set to True in production
                samesite="Lax",
                path="/",
                max_age=60 * 15,
            )
            response.set_cookie(
                key="refresh",
                value=str(refresh),
                httponly=True,
                secure=False,
                samesite="Lax",
                path="/",
                max_age=60 * 60 * 24,
            )
            return response
        except Exception as e:
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

        # Get role from profile
        user_role = getattr(user.profile, 'role', 'freelancer') if hasattr(user, 'profile') else 'freelancer'
        
        data = {
            "user": {"id": user.id, "username": user.username, "email": user.email, "role": user_role},
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
            path="/",
            max_age=60 * 15,
        )
        response.set_cookie(
            key="refresh",
            value=str(refresh),
            httponly=True,
            secure=False,
            samesite="Lax",
            path="/",
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
            path="/",
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
        response.delete_cookie("access", path="/")
        response.delete_cookie("refresh", path="/")
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
    Returns user-specific summary stats.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, 'profile', None)
        role = profile.role if profile else 'client'

        if role == 'client':
            active_projects = Project.objects.filter(client=user, status='active').count()
            pending_proposals = Proposal.objects.filter(job__posted_by=user, status='pending').count()
            hired_freelancers = Proposal.objects.filter(job__posted_by=user, status='accepted').values('freelancer').distinct().count()
            total_spent = Payment.objects.filter(user=user, status="completed").aggregate(total=Sum("amount"))["total"] or Decimal("0")
            
            data = {
                "active_projects": active_projects,
                "pending_proposals": pending_proposals,
                "total_spent": total_spent,
                "hired_freelancers": hired_freelancers,
            }
        else:
            # Freelancer view
            active_projects = Proposal.objects.filter(freelancer=user, status='accepted').count() # Projects they are hired for
            pending_proposals = Proposal.objects.filter(freelancer=user, status='pending').count()
            total_earned = Payment.objects.filter(user=user, status="completed").aggregate(total=Sum("amount"))["total"] or Decimal("0") # In real app, payments would come from clients to them
            profile_views = 156 # Mock value for now
            
            data = {
                "active_projects": active_projects,
                "pending_proposals": pending_proposals,
                "total_earned": total_earned,
                "profile_views": profile_views,
            }

        return Response(data)


class DashboardJobsView(generics.ListAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None)
        if profile and profile.role == 'client':
            return Job.objects.filter(posted_by=user).order_by("-created_at")[:3]
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
    Returns the latest message from each person the user has communicated with.
    """

    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Get unique senders who sent messages to the user
        latest_msgs = Message.objects.filter(receiver=user).values('sender').annotate(latest_id=Max('id'))
        ids = [m['latest_id'] for m in latest_msgs]
        return Message.objects.filter(id__in=ids).order_by("-created_at")


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
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ['status']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'deadline']
    ordering = ['-created_at']

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
    permission_classes = [IsAuthenticatedOrReadOnly]


class TaskCreateView(generics.CreateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]


class MeetingListCreateView(generics.ListCreateAPIView):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
    permission_classes = [IsAuthenticated]


class FreelancerListView(generics.ListAPIView):
    queryset = Profile.objects.filter(role="freelancer")
    serializer_class = ProfileSerializer
    permission_classes = [AllowAny]


class SupportRequestCreateView(generics.CreateAPIView):
    queryset = SupportRequest.objects.all()
    serializer_class = SupportRequestSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()


class ProposalListCreateView(generics.ListCreateAPIView):
    serializer_class = ProposalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        job_id = self.request.query_params.get('job_id')
        
        # If job_id is provided, filter by job (usually for client checking applications)
        if job_id:
            return Proposal.objects.filter(job_id=job_id)
            
        # If client, show proposals for their jobs
        if hasattr(user, 'profile') and user.profile.role == 'client':
            return Proposal.objects.filter(job__posted_by=user).order_by("-created_at")
            
        # If freelancer, show their own proposals
        return Proposal.objects.filter(freelancer=user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(freelancer=self.request.user)


class ProposalDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer
    permission_classes = [IsAuthenticated]


class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        freelancer_id = self.request.query_params.get('freelancer_id')
        if freelancer_id:
            return Review.objects.filter(freelancer_id=freelancer_id).order_by("-created_at")
        return Review.objects.all().order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)
