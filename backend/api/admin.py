from django.contrib import admin
from .models import (
    User, FreelancerProfile, RecruiterProfile, Job, Application,
    Notification, Conversation, Message, Earning,
    Project, Task, Meeting, RecruiterPayment, SupportRequest
)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'email']

@admin.register(FreelancerProfile)
class FreelancerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'experience_level', 'hourly_rate', 'availability']

@admin.register(RecruiterProfile)
class RecruiterProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'company_name', 'industry', 'total_jobs_posted']

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'recruiter', 'pay_per_hour', 'status', 'created_at']
    list_filter = ['status', 'experience_level', 'job_type']

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ['freelancer', 'job', 'status', 'created_at']
    list_filter = ['status']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'notification_type', 'title', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read']

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['freelancer', 'recruiter', 'job', 'created_at']

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'sender', 'content', 'is_read', 'created_at']
    list_filter = ['is_read']

@admin.register(Earning)
class EarningAdmin(admin.ModelAdmin):
    list_display = ['freelancer', 'job', 'amount', 'hours_worked', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['freelancer__username', 'description']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'client', 'status', 'progress', 'deadline', 'created_at']
    list_filter = ['status']

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'assigned_to', 'is_completed', 'due_date']
    list_filter = ['is_completed']

@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ['topic', 'project', 'timing', 'created_at']

@admin.register(RecruiterPayment)
class RecruiterPaymentAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'status', 'description', 'created_at']
    list_filter = ['status']

@admin.register(SupportRequest)
class SupportRequestAdmin(admin.ModelAdmin):
    list_display = ['user', 'subject', 'created_at']
