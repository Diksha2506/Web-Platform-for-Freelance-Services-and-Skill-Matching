from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Job, Profile, Message, Payment, Project, Task, Meeting, SupportRequest, Proposal, Review


User = get_user_model()


class JobSerializer(serializers.ModelSerializer):
    posted_by_username = serializers.CharField(source="posted_by.username", read_only=True)
    
    class Meta:
        model = Job
        fields = [
            "id", "title", "description", "category", "job_type", 
            "experience_level", "project_duration", "budget", "skills_required",
            "location", "remote_allowed", "attachments", "deadline",
            "posted_by", "posted_by_username", "created_at", "updated_at", "is_active"
        ]
        read_only_fields = ["id", "created_at", "updated_at", "posted_by"]

    def validate_budget(self, value):
        if value < 0:
            raise serializers.ValidationError("Budget must be a positive number.")
        return value


class ProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    
    class Meta:
        model = Profile
        fields = ["id", "user", "user_email", "full_name", "title", "bio", "skills", "role"]
        read_only_fields = ["id", "user"]

    def validate_full_name(self, value):
        if len(value) < 2:
            raise serializers.ValidationError("Full name must be at least 2 characters.")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    role = serializers.CharField(write_only=True, required=False, default='freelancer')

    class Meta:
        model = User
        fields = ("username", "email", "password", "password_confirm", "role")

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        if attrs.get("role") not in ["client", "freelancer"]:
            raise serializers.ValidationError({"role": "Role must be 'client' or 'freelancer'."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        role = validated_data.pop("role", "freelancer")
        validated_data.pop("password_confirm")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        # Create profile with correct role
        Profile.objects.get_or_create(
            user=user,
            defaults={
                "full_name": user.username,
                "title": "",
                "bio": "",
                "skills": "",
                "role": role,
            },
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Login serializer with extra validation and user payload.
    """

    def validate(self, attrs):
        username = attrs.get("username") or attrs.get(self.username_field)
        password = attrs.get("password")

        if not username or not password:
            raise serializers.ValidationError("Must include 'username' and 'password'.")

        user = authenticate(
            request=self.context.get("request"),
            username=username,
            password=password,
        )
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")

        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "role": getattr(self.user.profile, 'role', 'freelancer') if hasattr(self.user, 'profile') else 'freelancer',
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "profile")


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.username", read_only=True)
    receiver_name = serializers.CharField(source="receiver.username", read_only=True)

    class Meta:
        model = Message
        fields = ["id", "sender", "sender_name", "receiver", "receiver_name", "content", "created_at", "is_read"]
        read_only_fields = ["id", "sender", "created_at"]

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Message content cannot be empty.")
        return value


class PaymentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)
    
    class Meta:
        model = Payment
        fields = ["id", "user", "user_name", "amount", "status", "description", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value


class DashboardSummarySerializer(serializers.Serializer):
    active_projects = serializers.IntegerField()
    pending_proposals = serializers.IntegerField()
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2)
    hired_freelancers = serializers.IntegerField()


class SupportRequestSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)
    
    class Meta:
        model = SupportRequest
        fields = ["id", "user", "user_name", "subject", "message", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_subject(self, value):
        if len(value) < 5:
            raise serializers.ValidationError("Subject must be at least 5 characters.")
        return value

    def validate_message(self, value):
        if len(value) < 10:
            raise serializers.ValidationError("Message must be at least 10 characters.")
        return value

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["id", "project", "title", "description", "assigned_to", "due_date", "hours", "is_completed", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_hours(self, value):
        if value < 0:
            raise serializers.ValidationError("Hours cannot be negative.")
        return value


class MeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = ["id", "project", "topic", "description", "timing", "attendees", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProposalSerializer(serializers.ModelSerializer):
    freelancer_name = serializers.CharField(source="freelancer.username", read_only=True)
    job_title = serializers.CharField(source="job.title", read_only=True)
    job_posted_by = serializers.ReadOnlyField(source="job.posted_by.id")

    class Meta:
        model = Proposal
        fields = ["id", "job", "job_title", "freelancer", "freelancer_name", "cover_letter", "bid_amount", "status", "job_posted_by", "created_at", "updated_at"]
        read_only_fields = ["id", "freelancer", "created_at", "updated_at"]

    def validate_bid_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Bid amount must be greater than zero.")
        return value

    def validate_cover_letter(self, value):
        if len(value) < 10:
            raise serializers.ValidationError("Cover letter must be at least 10 characters.")
        return value


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.username", read_only=True)
    freelancer_name = serializers.CharField(source="freelancer.username", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "reviewer", "reviewer_name", "freelancer", "freelancer_name", "project", "rating", "comment", "created_at"]
        read_only_fields = ["id", "reviewer", "created_at"]

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_comment(self, value):
        if len(value) < 5:
            raise serializers.ValidationError("Comment must be at least 5 characters.")
        return value


class ProjectSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    meetings = MeetingSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source="client.username", read_only=True)

    class Meta:
        model = Project
        fields = ["id", "title", "description", "status", "deadline", "planned_hours", "progress", "client", "client_name", "tasks", "meetings", "reviews", "created_at"]
        read_only_fields = ["id", "client", "created_at"]

    def validate_progress(self, value):
        if not 0 <= value <= 100:
            raise serializers.ValidationError("Progress must be between 0 and 100.")
        return value
