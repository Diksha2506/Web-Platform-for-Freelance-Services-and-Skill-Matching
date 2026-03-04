from django.db import models
from django.conf import settings


class Job(models.Model):
    JOB_TYPE_CHOICES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('freelance', 'Freelance'),
    ]
    
    EXPERIENCE_LEVEL_CHOICES = [
        ('entry', 'Entry Level'),
        ('intermediate', 'Intermediate'),
        ('expert', 'Expert'),
    ]
    
    PROJECT_DURATION_CHOICES = [
        ('less_than_1_month', 'Less than 1 month'),
        ('1_3_months', '1-3 months'),
        ('3_6_months', '3-6 months'),
        ('more_than_6_months', 'More than 6 months'),
    ]
    
    # Basic Information
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100, default='other')
    
    # Job Details
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default='freelance')
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL_CHOICES, default='intermediate')
    project_duration = models.CharField(max_length=30, choices=PROJECT_DURATION_CHOICES, default='1_3_months')
    
    # Budget
    budget = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    
    # Requirements
    skills_required = models.TextField(help_text='Comma-separated skills', default='')
    location = models.CharField(max_length=200, blank=True, null=True)
    remote_allowed = models.BooleanField(default=True)
    
    # Additional Details
    attachments = models.TextField(blank=True, null=True, help_text='File URLs or paths')
    deadline = models.DateField(blank=True, null=True)
    
    # Metadata
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posted_jobs',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=200)
    title = models.CharField(max_length=200)
    bio = models.TextField()
    skills = models.CharField(max_length=300)
    role = models.CharField(max_length=20, default='freelancer')

    def __str__(self):
        return self.full_name


class Message(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="sent_messages",
        on_delete=models.CASCADE,
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="received_messages",
        on_delete=models.CASCADE,
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"From {self.sender_id} to {self.receiver_id}"


class Payment(models.Model):
    STATUS_CHOICES = [
        ("completed", "Completed"),
        ("pending", "Pending"),
        ("escrow", "In Escrow"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="payments",
        on_delete=models.CASCADE,
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user_id} - {self.amount} ({self.status})"


class Project(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('on_hold', 'On Hold'),
    ]
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    deadline = models.DateField()
    planned_hours = models.IntegerField(default=0)
    progress = models.IntegerField(default=0)  # 0 to 100
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_projects',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Task(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    assigned_to = models.TextField()  # Comma-separated or multi-line names
    due_date = models.DateField()
    hours = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Meeting(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='meetings')
    topic = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    timing = models.DateTimeField()
    attendees = models.TextField()  # Comma-separated names
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.topic} - {self.timing}"


class SupportRequest(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    subject = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.subject


class Proposal(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('interview', 'Interview Scheduled'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='proposals')
    freelancer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='proposals')
    cover_letter = models.TextField()
    bid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('job', 'freelancer')

    def __str__(self):
        return f"Proposal for {self.job.title} by {self.freelancer.username}"


class Review(models.Model):
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='given_reviews')
    freelancer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_reviews')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    rating = models.IntegerField(default=5)  # 1 to 5
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review for {self.freelancer.username} by {self.reviewer.username}"
