from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ('freelancer', 'Freelancer'),
        ('recruiter', 'Recruiter'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class FreelancerProfile(models.Model):
    EXPERIENCE_CHOICES = (
        ('entry', 'Entry Level'),
        ('intermediate', 'Intermediate'),
        ('expert', 'Expert'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='freelancer_profile')
    title = models.CharField(max_length=200, blank=True, null=True)
    skills = models.JSONField(default=list, blank=True)
    tech_stack = models.JSONField(default=list, blank=True)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES, default='entry')
    years_of_experience = models.IntegerField(default=0)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    education = models.TextField(blank=True, null=True)
    portfolio_url = models.URLField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    availability = models.BooleanField(default=True)
    completed_projects = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.user.username}'s Freelancer Profile"


class RecruiterProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='recruiter_profile')
    company_name = models.CharField(max_length=200, blank=True, null=True)
    company_website = models.URLField(blank=True, null=True)
    company_logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    company_description = models.TextField(blank=True, null=True)
    industry = models.CharField(max_length=100, blank=True, null=True)
    company_size = models.CharField(max_length=50, blank=True, null=True)
    total_jobs_posted = models.IntegerField(default=0)
    total_hires = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username}'s Recruiter Profile"


class Job(models.Model):
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('closed', 'Closed'),
        ('in_progress', 'In Progress'),
    )
    EXPERIENCE_CHOICES = (
        ('entry', 'Entry Level'),
        ('intermediate', 'Intermediate'),
        ('expert', 'Expert'),
    )
    JOB_TYPE_CHOICES = (
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('freelance', 'Freelance'),
    )
    recruiter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_jobs')
    title = models.CharField(max_length=300)
    description = models.TextField()
    required_skills = models.JSONField(default=list)
    pay_per_hour = models.DecimalField(max_digits=10, decimal_places=2)
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES)
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default='freelance')
    location = models.CharField(max_length=200, blank=True, default='Remote')
    duration = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    applicants_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deadline = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Application(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    cover_letter = models.TextField(blank=True, null=True)
    proposed_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['job', 'freelancer']

    def __str__(self):
        return f"{self.freelancer.username} -> {self.job.title}"


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('application_received', 'Application Received'),
        ('application_accepted', 'Application Accepted'),
        ('application_rejected', 'Application Rejected'),
        ('new_job', 'New Job Posted'),
        ('message', 'Message'),
        ('interview_scheduled', 'Interview Scheduled'),
        ('interview_cancelled', 'Interview Cancelled'),
        ('interview_completed', 'Interview Completed'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=300)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type} for {self.user.username}"


class Conversation(models.Model):
    """A conversation thread between a freelancer and recruiter, tied to a job application."""
    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='conversation')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='freelancer_conversations')
    recruiter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recruiter_conversations')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat: {self.freelancer.username} <-> {self.recruiter.username} on {self.job.title}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"


class Project(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('on_hold', 'On Hold'),
    )
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    deadline = models.DateField(blank=True, null=True)
    planned_hours = models.DecimalField(max_digits=8, decimal_places=1, default=0)
    progress = models.IntegerField(default=0)  # 0-100
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Task(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True, default='')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    due_date = models.DateField(blank=True, null=True)
    hours = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['due_date']

    def __str__(self):
        return f"{self.title} ({self.project.title})"


class Meeting(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='meetings')
    topic = models.CharField(max_length=300)
    description = models.TextField(blank=True, default='')
    timing = models.DateTimeField()
    attendees = models.ManyToManyField(User, blank=True, related_name='meetings')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timing']

    def __str__(self):
        return f"{self.topic} ({self.project.title})"


class RecruiterPayment(models.Model):
    STATUS_CHOICES = (
        ('completed', 'Completed'),
        ('pending', 'Pending'),
        ('escrow', 'In Escrow'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recruiter_payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    description = models.CharField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - ${self.amount} ({self.status})"


class SupportRequest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='support_requests')
    subject = models.CharField(max_length=300)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.subject} by {self.user.username}"


class Earning(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('processing', 'Processing'),
        ('cancelled', 'Cancelled'),
    )
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='earnings')
    job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True, related_name='earnings')
    application = models.ForeignKey(Application, on_delete=models.SET_NULL, null=True, blank=True, related_name='earnings')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    hours_worked = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    description = models.CharField(max_length=500, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.freelancer.username} - ${self.amount} ({self.status})"


class Interview(models.Model):
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='interviews')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='interviews')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interviews_as_candidate')
    recruiter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interviews_as_interviewer')
    scheduled_at = models.DateTimeField()
    duration_minutes = models.IntegerField(default=30)
    interview_type = models.CharField(max_length=30, default='video', choices=(
        ('video', 'Video Call'),
        ('phone', 'Phone Call'),
        ('in_person', 'In Person'),
    ))
    meeting_link = models.URLField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    feedback = models.TextField(blank=True, default='')
    rating = models.IntegerField(null=True, blank=True)  # 1-5
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['scheduled_at']

    def __str__(self):
        return f"Interview: {self.freelancer.username} for {self.job.title} on {self.scheduled_at}"
