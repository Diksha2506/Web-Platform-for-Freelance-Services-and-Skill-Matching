from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Job, Profile, Message, Payment, Project, Task, Meeting, SupportRequest


User = get_user_model()


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = "__all__"


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = "__all__"


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    role = serializers.CharField(write_only=True, required=False, default='freelancer')

    class Meta:
        model = User
        fields = ("username", "email", "password", "password_confirm", "role")

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("Passwords do not match.")
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
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.username", read_only=True)

    class Meta:
        model = Message
        fields = ("id", "sender_name", "content", "created_at", "is_read")


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ("id", "amount", "status", "description", "created_at")


class DashboardSummarySerializer(serializers.Serializer):
    active_projects = serializers.IntegerField()
    pending_proposals = serializers.IntegerField()
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2)
    hired_freelancers = serializers.IntegerField()


class SupportRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportRequest
        fields = "__all__"


class SupportRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportRequest
        fields = "__all__"


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = "__all__"


class MeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = "__all__"


class ProjectSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    meetings = MeetingSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = "__all__"
