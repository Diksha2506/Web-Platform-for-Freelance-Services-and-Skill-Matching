from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import (
    User, FreelancerProfile, RecruiterProfile, Job, Application,
    Notification, Conversation, Message, Earning,
    Project, Task, Meeting, RecruiterPayment, SupportRequest, Interview
)


class FreelancerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FreelancerProfile
        fields = '__all__'
        read_only_fields = ['user']


class RecruiterProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecruiterProfile
        fields = '__all__'
        read_only_fields = ['user']


class UserSerializer(serializers.ModelSerializer):
    freelancer_profile = FreelancerProfileSerializer(read_only=True)
    recruiter_profile = RecruiterProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role',
                  'phone', 'avatar', 'bio', 'location', 'created_at',
                  'freelancer_profile', 'recruiter_profile']
        read_only_fields = ['id', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name',
                  'last_name', 'role', 'phone']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered."})
        if not data.get('role'):
            raise serializers.ValidationError({"role": "Role is required."})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Create the appropriate profile
        if user.role == 'freelancer':
            FreelancerProfile.objects.create(user=user)
        elif user.role == 'recruiter':
            RecruiterProfile.objects.create(user=user)

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username_or_email = data.get('username')
        password = data.get('password')
        
        # Try finding the user by email first
        try:
            user_obj = User.objects.get(email=username_or_email)
            username = user_obj.username
        except User.DoesNotExist:
            username = username_or_email

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")
        data['user'] = user
        return data


class JobSerializer(serializers.ModelSerializer):
    recruiter_name = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()
    has_applied = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = '__all__'
        read_only_fields = ['recruiter', 'applicants_count', 'created_at', 'updated_at']

    def get_recruiter_name(self, obj):
        return f"{obj.recruiter.first_name} {obj.recruiter.last_name}"

    def get_company_name(self, obj):
        try:
            return obj.recruiter.recruiter_profile.company_name or "N/A"
        except RecruiterProfile.DoesNotExist:
            return "N/A"

    def get_has_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'freelancer':
            return Application.objects.filter(job=obj, freelancer=request.user).exists()
        return False


class ApplicationSerializer(serializers.ModelSerializer):
    freelancer_name = serializers.SerializerMethodField()
    freelancer_email = serializers.SerializerMethodField()
    freelancer_skills = serializers.SerializerMethodField()
    job_title = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = ['freelancer', 'created_at', 'updated_at']

    def get_freelancer_name(self, obj):
        return f"{obj.freelancer.first_name} {obj.freelancer.last_name}"

    def get_freelancer_email(self, obj):
        return obj.freelancer.email

    def get_freelancer_skills(self, obj):
        try:
            return obj.freelancer.freelancer_profile.skills
        except FreelancerProfile.DoesNotExist:
            return []

    def get_job_title(self, obj):
        return obj.job.title


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'sender_role',
                  'content', 'is_read', 'is_mine', 'created_at']
        read_only_fields = ['sender', 'created_at', 'is_read']

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username

    def get_sender_role(self, obj):
        return obj.sender.role

    def get_is_mine(self, obj):
        request = self.context.get('request')
        return request and obj.sender == request.user


class ConversationSerializer(serializers.ModelSerializer):
    other_user_name = serializers.SerializerMethodField()
    other_user_role = serializers.SerializerMethodField()
    job_title = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'application', 'freelancer', 'recruiter', 'job',
                  'other_user_name', 'other_user_role', 'job_title',
                  'last_message', 'unread_count', 'created_at', 'updated_at']

    def get_other_user_name(self, obj):
        request = self.context.get('request')
        if request:
            other = obj.recruiter if request.user == obj.freelancer else obj.freelancer
            return f"{other.first_name} {other.last_name}".strip() or other.username
        return ''

    def get_other_user_role(self, obj):
        request = self.context.get('request')
        if request:
            other = obj.recruiter if request.user == obj.freelancer else obj.freelancer
            return other.role
        return ''

    def get_job_title(self, obj):
        return obj.job.title

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if msg:
            return {'content': msg.content[:80], 'sender_name': self.get_sender_short(msg), 'created_at': msg.created_at}
        return None

    def get_sender_short(self, msg):
        return msg.sender.first_name or msg.sender.username

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0


class EarningSerializer(serializers.ModelSerializer):
    job_title = serializers.SerializerMethodField()
    recruiter_name = serializers.SerializerMethodField()
    freelancer_name = serializers.SerializerMethodField()

    class Meta:
        model = Earning
        fields = ['id', 'freelancer', 'job', 'application', 'amount', 'hours_worked',
                  'description', 'status', 'paid_at', 'created_at', 'updated_at',
                  'job_title', 'recruiter_name', 'freelancer_name']
        read_only_fields = ['freelancer', 'created_at', 'updated_at']

    def get_job_title(self, obj):
        return obj.job.title if obj.job else 'N/A'

    def get_recruiter_name(self, obj):
        if obj.job:
            r = obj.job.recruiter
            return f"{r.first_name} {r.last_name}".strip() or r.username
        return 'N/A'

    def get_freelancer_name(self, obj):
        f = obj.freelancer
        return f"{f.first_name} {f.last_name}".strip() or f.username


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['created_at']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.username
        return 'Unassigned'


class MeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = '__all__'
        read_only_fields = ['created_at']


class ProjectSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    meetings = MeetingSerializer(many=True, read_only=True)
    task_count = serializers.SerializerMethodField()
    completed_task_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['client', 'created_at', 'updated_at']

    def get_task_count(self, obj):
        return obj.tasks.count()

    def get_completed_task_count(self, obj):
        return obj.tasks.filter(is_completed=True).count()


class RecruiterPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecruiterPayment
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class SupportRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportRequest
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class InterviewSerializer(serializers.ModelSerializer):
    freelancer_name = serializers.SerializerMethodField()
    recruiter_name = serializers.SerializerMethodField()
    job_title = serializers.SerializerMethodField()

    class Meta:
        model = Interview
        fields = ['id', 'application', 'job', 'freelancer', 'recruiter',
                  'scheduled_at', 'duration_minutes', 'interview_type',
                  'meeting_link', 'notes', 'status', 'feedback', 'rating',
                  'created_at', 'updated_at',
                  'freelancer_name', 'recruiter_name', 'job_title']
        read_only_fields = ['freelancer', 'recruiter', 'job', 'created_at', 'updated_at']

    def get_freelancer_name(self, obj):
        return f"{obj.freelancer.first_name} {obj.freelancer.last_name}".strip() or obj.freelancer.username

    def get_recruiter_name(self, obj):
        return f"{obj.recruiter.first_name} {obj.recruiter.last_name}".strip() or obj.recruiter.username

    def get_job_title(self, obj):
        return obj.job.title
