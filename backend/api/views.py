from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from django.contrib.auth import login, logout
from django.core.mail import send_mail
from django.conf import settings
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from .models import (
    User, FreelancerProfile, RecruiterProfile, Job, Application,
    Notification, Conversation, Message, Earning,
    Project, Task, Meeting, RecruiterPayment, SupportRequest, Interview
)
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    JobSerializer, ApplicationSerializer, NotificationSerializer,
    FreelancerProfileSerializer, RecruiterProfileSerializer,
    ConversationSerializer, MessageSerializer, EarningSerializer,
    ProjectSerializer, TaskSerializer, MeetingSerializer,
    RecruiterPaymentSerializer, SupportRequestSerializer, InterviewSerializer
)
from django.db.models import Sum, Q
from django.utils import timezone


# ─── CSRF Token ──────────────────────────────────────────────

@ensure_csrf_cookie
def csrf_token_view(request):
    return JsonResponse({'csrfToken': get_token(request)})


# ─── Auth Views ───────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        login(request, user)
        return Response({
            'message': 'Registration successful',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@authentication_classes([])  # Skip SessionAuthentication (which enforces CSRF)
@permission_classes([permissions.AllowAny])
def logout_view(request):
    logout(request)
    response = Response({'message': 'Logged out successfully'})
    response.delete_cookie('csrftoken')
    response.delete_cookie('sessionid')
    return response


@api_view(['GET'])
def current_user(request):
    return Response(UserSerializer(request.user).data)


@api_view(['PUT'])
def update_profile(request):
    user = request.user
    user_data = {}
    for field in ['first_name', 'last_name', 'phone', 'bio', 'location']:
        if field in request.data:
            user_data[field] = request.data[field]

    for key, value in user_data.items():
        setattr(user, key, value)
    user.save()

    # Update role-specific profile
    if user.role == 'freelancer':
        profile = user.freelancer_profile
        profile_fields = ['title', 'skills', 'tech_stack', 'experience_level',
                         'years_of_experience', 'hourly_rate', 'education',
                         'portfolio_url', 'github_url', 'linkedin_url', 'availability']
        for field in profile_fields:
            if field in request.data:
                setattr(profile, field, request.data[field])
        profile.save()
    elif user.role == 'recruiter':
        profile = user.recruiter_profile
        profile_fields = ['company_name', 'company_website', 'company_description',
                         'industry', 'company_size']
        for field in profile_fields:
            if field in request.data:
                setattr(profile, field, request.data[field])
        profile.save()

    return Response(UserSerializer(user).data)


# ─── Job Views ───────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def job_list(request):
    jobs = Job.objects.filter(status='open')
    skill_filter = request.query_params.get('skills', None)
    exp_filter = request.query_params.get('experience_level', None)
    search = request.query_params.get('search', None)

    if skill_filter:
        skills = skill_filter.split(',')
        for skill in skills:
            jobs = jobs.filter(required_skills__contains=[skill.strip()])
    if exp_filter:
        jobs = jobs.filter(experience_level=exp_filter)
    if search:
        jobs = jobs.filter(title__icontains=search)

    serializer = JobSerializer(jobs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def job_detail(request, pk):
    try:
        job = Job.objects.get(pk=pk)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = JobSerializer(job, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
def create_job(request):
    if request.user.role != 'recruiter':
        return Response({'error': 'Only recruiters can post jobs'}, status=status.HTTP_403_FORBIDDEN)

    serializer = JobSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        job = serializer.save(recruiter=request.user)
        # Update recruiter's total jobs count
        profile = request.user.recruiter_profile
        profile.total_jobs_posted += 1
        profile.save()
        return Response(JobSerializer(job, context={'request': request}).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
def update_job(request, pk):
    try:
        job = Job.objects.get(pk=pk, recruiter=request.user)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = JobSerializer(job, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
def delete_job(request, pk):
    try:
        job = Job.objects.get(pk=pk, recruiter=request.user)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
    job.delete()
    return Response({'message': 'Job deleted successfully'})


@api_view(['GET'])
def my_jobs(request):
    """Get jobs posted by the recruiter"""
    if request.user.role != 'recruiter':
        return Response({'error': 'Only recruiters can view their jobs'}, status=status.HTTP_403_FORBIDDEN)
    jobs = Job.objects.filter(recruiter=request.user)
    serializer = JobSerializer(jobs, many=True, context={'request': request})
    return Response(serializer.data)


# ─── Application Views ──────────────────────────────────────

@api_view(['POST'])
def apply_job(request, pk):
    if request.user.role != 'freelancer':
        return Response({'error': 'Only freelancers can apply'}, status=status.HTTP_403_FORBIDDEN)

    try:
        job = Job.objects.get(pk=pk)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

    if Application.objects.filter(job=job, freelancer=request.user).exists():
        return Response({'error': 'Already applied'}, status=status.HTTP_400_BAD_REQUEST)

    application = Application.objects.create(
        job=job,
        freelancer=request.user,
        cover_letter=request.data.get('cover_letter', ''),
        proposed_rate=request.data.get('proposed_rate', job.pay_per_hour)
    )

    # Update applicant count
    job.applicants_count += 1
    job.save()

    # Notify recruiter
    Notification.objects.create(
        user=job.recruiter,
        notification_type='application_received',
        title='New Application Received',
        message=f'{request.user.first_name} {request.user.last_name} applied for "{job.title}"',
        related_job=job
    )

    return Response(ApplicationSerializer(application).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def my_applications(request):
    """Get applications submitted by the freelancer"""
    if request.user.role != 'freelancer':
        return Response({'error': 'Only freelancers can view their applications'}, status=status.HTTP_403_FORBIDDEN)
    applications = Application.objects.filter(freelancer=request.user)
    serializer = ApplicationSerializer(applications, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def job_applications(request, pk):
    """Get all applications for a specific job (recruiter only)"""
    if request.user.role != 'recruiter':
        return Response({'error': 'Only recruiters can view applications'}, status=status.HTTP_403_FORBIDDEN)
    try:
        job = Job.objects.get(pk=pk, recruiter=request.user)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

    applications = Application.objects.filter(job=job)
    serializer = ApplicationSerializer(applications, many=True)
    return Response(serializer.data)


@api_view(['PUT'])
def update_application_status(request, pk):
    """Update application status (recruiter only)"""
    if request.user.role != 'recruiter':
        return Response({'error': 'Only recruiters can update applications'}, status=status.HTTP_403_FORBIDDEN)

    try:
        application = Application.objects.get(pk=pk, job__recruiter=request.user)
    except Application.DoesNotExist:
        return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if new_status not in ['pending', 'reviewed', 'accepted', 'rejected']:
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    application.status = new_status
    application.save()

    # Notify freelancer
    if new_status == 'accepted':
        notification_type = 'application_accepted'
        title = 'Application Accepted!'
        message = f'Congratulations! Your application for "{application.job.title}" has been accepted.'

        # Update recruiter hire count
        profile = request.user.recruiter_profile
        profile.total_hires += 1
        profile.save()
    elif new_status == 'rejected':
        notification_type = 'application_rejected'
        title = 'Application Update'
        message = f'Your application for "{application.job.title}" was not selected.'
    else:
        notification_type = 'message'
        title = 'Application Update'
        message = f'Your application for "{application.job.title}" status updated to {new_status}.'

    Notification.objects.create(
        user=application.freelancer,
        notification_type=notification_type,
        title=title,
        message=message,
        related_job=application.job
    )

    return Response(ApplicationSerializer(application).data)


# ─── Notification Views ─────────────────────────────────────

@api_view(['GET'])
def notifications(request):
    notifs = Notification.objects.filter(user=request.user)
    serializer = NotificationSerializer(notifs, many=True)
    return Response(serializer.data)


@api_view(['PUT'])
def mark_notification_read(request, pk):
    try:
        notif = Notification.objects.get(pk=pk, user=request.user)
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
    notif.is_read = True
    notif.save()
    return Response({'message': 'Marked as read'})


@api_view(['PUT'])
def mark_all_notifications_read(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'message': 'All notifications marked as read'})


# ─── Dashboard Stats ─────────────────────────────────────────

@api_view(['GET'])
def dashboard_stats(request):
    user = request.user

    if user.role == 'freelancer':
        applications = Application.objects.filter(freelancer=user)
        return Response({
            'total_applications': applications.count(),
            'pending_applications': applications.filter(status='pending').count(),
            'accepted_applications': applications.filter(status='accepted').count(),
            'rejected_applications': applications.filter(status='rejected').count(),
            'available_jobs': Job.objects.filter(status='open').count(),
            'profile_completion': _get_profile_completion(user),
        })
    elif user.role == 'recruiter':
        jobs = Job.objects.filter(recruiter=user)
        applications = Application.objects.filter(job__recruiter=user)
        return Response({
            'total_jobs_posted': jobs.count(),
            'open_jobs': jobs.filter(status='open').count(),
            'total_applications': applications.count(),
            'pending_applications': applications.filter(status='pending').count(),
            'total_hires': applications.filter(status='accepted').count(),
        })

    return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)


def _get_profile_completion(user):
    fields_filled = 0
    total_fields = 10
    if user.first_name: fields_filled += 1
    if user.last_name: fields_filled += 1
    if user.email: fields_filled += 1
    if user.phone: fields_filled += 1
    if user.bio: fields_filled += 1
    if user.location: fields_filled += 1
    try:
        profile = user.freelancer_profile
        if profile.skills: fields_filled += 1
        if profile.title: fields_filled += 1
        if profile.hourly_rate > 0: fields_filled += 1
        if profile.education: fields_filled += 1
    except FreelancerProfile.DoesNotExist:
        pass
    return int((fields_filled / total_fields) * 100)


# ─── Chat / Messaging Views ─────────────────────────────────

@api_view(['GET'])
def conversation_list(request):
    """Get all conversations for the current user."""
    user = request.user
    if user.role == 'freelancer':
        convos = Conversation.objects.filter(freelancer=user)
    else:
        convos = Conversation.objects.filter(recruiter=user)
    serializer = ConversationSerializer(convos, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
def start_conversation(request, application_id):
    """Start or get a conversation for an application."""
    try:
        application = Application.objects.get(pk=application_id)
    except Application.DoesNotExist:
        return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

    # Only the freelancer (applicant) or the recruiter (job owner) can start a chat
    user = request.user
    if user != application.freelancer and user != application.job.recruiter:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    # Get or create the conversation
    convo, created = Conversation.objects.get_or_create(
        application=application,
        defaults={
            'freelancer': application.freelancer,
            'recruiter': application.job.recruiter,
            'job': application.job,
        }
    )
    serializer = ConversationSerializer(convo, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['GET'])
def conversation_messages(request, pk):
    """Get all messages in a conversation."""
    try:
        convo = Conversation.objects.get(pk=pk)
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)

    # Only participants can view
    if request.user != convo.freelancer and request.user != convo.recruiter:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    # Mark unread messages from the other user as read
    convo.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

    messages = convo.messages.all()
    serializer = MessageSerializer(messages, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
def send_message(request, pk):
    """Send a message in a conversation."""
    try:
        convo = Conversation.objects.get(pk=pk)
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)

    # Only participants can send
    if request.user != convo.freelancer and request.user != convo.recruiter:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    content = request.data.get('content', '').strip()
    if not content:
        return Response({'error': 'Message content is required'}, status=status.HTTP_400_BAD_REQUEST)

    msg = Message.objects.create(
        conversation=convo,
        sender=request.user,
        content=content,
    )

    # Update conversation timestamp
    convo.save()  # triggers auto_now on updated_at

    # Create a notification for the other user
    other_user = convo.recruiter if request.user == convo.freelancer else convo.freelancer
    sender_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
    Notification.objects.create(
        user=other_user,
        notification_type='message',
        title=f'New message from {sender_name}',
        message=content[:100],
        related_job=convo.job,
    )

    serializer = MessageSerializer(msg, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# ─── Earnings / Payments Views ───────────────────────────────

@api_view(['GET'])
def earnings_list(request):
    """Get all earnings for the current freelancer."""
    if request.user.role != 'freelancer':
        return Response({'error': 'Only freelancers can view earnings'}, status=status.HTTP_403_FORBIDDEN)
    
    earnings = Earning.objects.filter(freelancer=request.user)
    serializer = EarningSerializer(earnings, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def earnings_stats(request):
    """Get earnings summary stats for the freelancer."""
    if request.user.role != 'freelancer':
        return Response({'error': 'Only freelancers can view earnings'}, status=status.HTTP_403_FORBIDDEN)
    
    user = request.user
    all_earnings = Earning.objects.filter(freelancer=user)
    
    total_earned = all_earnings.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0
    pending_amount = all_earnings.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0
    processing_amount = all_earnings.filter(status='processing').aggregate(total=Sum('amount'))['total'] or 0
    total_hours = all_earnings.filter(status='paid').aggregate(total=Sum('hours_worked'))['total'] or 0
    
    # Monthly earnings (last 6 months)
    now = timezone.now()
    monthly = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timezone.timedelta(days=i * 30)).replace(day=1)
        if i > 0:
            month_end = (month_start + timezone.timedelta(days=32)).replace(day=1)
        else:
            month_end = now
        month_total = all_earnings.filter(
            status='paid',
            paid_at__gte=month_start,
            paid_at__lt=month_end
        ).aggregate(total=Sum('amount'))['total'] or 0
        monthly.append({
            'month': month_start.strftime('%b %Y'),
            'amount': float(month_total),
        })
    
    return Response({
        'total_earned': float(total_earned),
        'pending_amount': float(pending_amount),
        'processing_amount': float(processing_amount),
        'total_hours': float(total_hours),
        'total_transactions': all_earnings.count(),
        'paid_transactions': all_earnings.filter(status='paid').count(),
        'monthly_earnings': monthly,
    })


@api_view(['POST'])
def request_payment(request):
    """Freelancer requests payment for an accepted application."""
    if request.user.role != 'freelancer':
        return Response({'error': 'Only freelancers can request payment'}, status=status.HTTP_403_FORBIDDEN)
    
    application_id = request.data.get('application_id')
    hours_worked = request.data.get('hours_worked', 0)
    description = request.data.get('description', '')
    
    if not application_id:
        return Response({'error': 'Application ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        application = Application.objects.get(pk=application_id, freelancer=request.user, status='accepted')
    except Application.DoesNotExist:
        return Response({'error': 'Accepted application not found'}, status=status.HTTP_404_NOT_FOUND)
    
    try:
        hours = float(hours_worked)
    except (ValueError, TypeError):
        hours = 0
    
    rate = float(application.proposed_rate or application.job.pay_per_hour)
    amount = round(rate * hours, 2)
    
    earning = Earning.objects.create(
        freelancer=request.user,
        job=application.job,
        application=application,
        amount=amount,
        hours_worked=hours,
        description=description or f"Work on: {application.job.title}",
        status='pending',
    )
    
    # Notify freelancer
    Notification.objects.create(
        user=request.user,
        notification_type='message',
        title='Payment Requested',
        message=f'Payment of ${amount} requested for "{application.job.title}"',
        related_job=application.job,
    )

    # Notify recruiter about the payment request
    Notification.objects.create(
        user=application.job.recruiter,
        notification_type='message',
        title='New Payment Request',
        message=f'{request.user.first_name or request.user.username} requested ${amount} for "{application.job.title}"',
        related_job=application.job,
    )
    
    serializer = EarningSerializer(earning)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# ─── Projects Views ──────────────────────────────────────────

@api_view(['GET', 'POST'])
def project_list_create(request):
    """List all projects for the recruiter or create a new one."""
    if request.user.role != 'recruiter':
        return Response({'error': 'Only recruiters can manage projects'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        projects = Project.objects.filter(client=request.user)
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)

    # POST
    serializer = ProjectSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(client=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def project_detail(request, pk):
    """Retrieve, update, or delete a specific project."""
    try:
        project = Project.objects.get(pk=pk, client=request.user)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ProjectSerializer(project)
        return Response(serializer.data)

    if request.method == 'PUT':
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE
    project.delete()
    return Response({'message': 'Project deleted'})


@api_view(['POST'])
def task_create(request, project_id):
    """Create a task for a project."""
    try:
        project = Project.objects.get(pk=project_id, client=request.user)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = TaskSerializer(data={**request.data, 'project': project.id})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
def task_toggle(request, pk):
    """Toggle task completion. Allowed by project owner or the assigned freelancer."""
    try:
        task = Task.objects.get(
            Q(pk=pk, project__client=request.user) |
            Q(pk=pk, assigned_to=request.user)
        )
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

    task.is_completed = not task.is_completed
    task.save()

    # Recalculate project progress
    project = task.project
    total = project.tasks.count()
    completed = project.tasks.filter(is_completed=True).count()
    project.progress = int((completed / total) * 100) if total > 0 else 0
    project.save()

    return Response(TaskSerializer(task).data)


@api_view(['POST'])
def meeting_create(request, project_id):
    """Schedule a meeting for a project."""
    try:
        project = Project.objects.get(pk=project_id, client=request.user)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = MeetingSerializer(data={**request.data, 'project': project.id})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Freelancer Project Views ────────────────────────────────

@api_view(['GET'])
def freelancer_projects(request):
    """List projects where the freelancer has assigned tasks or is a meeting attendee."""
    if request.user.role != 'freelancer':
        return Response({'error': 'Only freelancers can access this'}, status=status.HTTP_403_FORBIDDEN)
    project_ids = set(Task.objects.filter(assigned_to=request.user).values_list('project_id', flat=True).distinct())
    meeting_project_ids = set(Meeting.objects.filter(attendees=request.user).values_list('project_id', flat=True).distinct())
    all_ids = project_ids | meeting_project_ids
    projects = Project.objects.filter(pk__in=all_ids)
    serializer = ProjectSerializer(projects, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def freelancer_project_detail(request, pk):
    """Get project detail for a freelancer (must be assigned to a task or meeting in it)."""
    if request.user.role != 'freelancer':
        return Response({'error': 'Only freelancers can access this'}, status=status.HTTP_403_FORBIDDEN)
    has_task = Task.objects.filter(project_id=pk, assigned_to=request.user).exists()
    has_meeting = Meeting.objects.filter(project_id=pk, attendees=request.user).exists()
    if not has_task and not has_meeting:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
    try:
        project = Project.objects.get(pk=pk)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
    serializer = ProjectSerializer(project)
    return Response(serializer.data)


# ─── Recruiter Payment Views ────────────────────────────────

@api_view(['GET'])
def recruiter_payment_summary(request):
    """Get payment summary for the recruiter."""
    if request.user.role != 'recruiter':
        return Response({'error': 'Only recruiters can view payments'}, status=status.HTTP_403_FORBIDDEN)

    payments = RecruiterPayment.objects.filter(user=request.user)
    total_spent = payments.filter(status='completed').aggregate(total=Sum('amount'))['total'] or 0
    in_escrow = payments.filter(status='escrow').aggregate(total=Sum('amount'))['total'] or 0
    pending = payments.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0

    now = timezone.now()
    monthly = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timezone.timedelta(days=i * 30)).replace(day=1)
        if i > 0:
            month_end = (month_start + timezone.timedelta(days=32)).replace(day=1)
        else:
            month_end = now
        month_total = payments.filter(
            status='completed',
            created_at__gte=month_start,
            created_at__lt=month_end
        ).aggregate(total=Sum('amount'))['total'] or 0
        monthly.append({
            'month': month_start.strftime('%b %Y'),
            'amount': float(month_total),
        })

    return Response({
        'total_spent': float(total_spent),
        'in_escrow': float(in_escrow),
        'pending': float(pending),
        'total_transactions': payments.count(),
        'monthly_spending': monthly,
    })


@api_view(['GET'])
def recruiter_payment_transactions(request):
    """List all payment transactions for the recruiter."""
    if request.user.role != 'recruiter':
        return Response({'error': 'Only recruiters can view payments'}, status=status.HTTP_403_FORBIDDEN)

    payments = RecruiterPayment.objects.filter(user=request.user)
    serializer = RecruiterPaymentSerializer(payments, many=True)
    return Response(serializer.data)


# ─── Recruiter Payment Requests ──────────────────────────────

@api_view(['GET'])
def recruiter_payment_requests(request):
    """List all pending payment requests from freelancers for the recruiter's jobs."""
    if request.user.role != 'recruiter':
        return Response({'error': 'Only recruiters can view payment requests'}, status=status.HTTP_403_FORBIDDEN)

    earnings = Earning.objects.filter(
        job__recruiter=request.user,
        status='pending',
    ).select_related('freelancer', 'job')
    serializer = EarningSerializer(earnings, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def approve_payment_request(request, pk):
    """Recruiter approves a freelancer's payment request."""
    if request.user.role != 'recruiter':
        return Response({'error': 'Only recruiters can approve payments'}, status=status.HTTP_403_FORBIDDEN)

    try:
        earning = Earning.objects.get(pk=pk, job__recruiter=request.user, status='pending')
    except Earning.DoesNotExist:
        return Response({'error': 'Payment request not found'}, status=status.HTTP_404_NOT_FOUND)

    earning.status = 'paid'
    earning.paid_at = timezone.now()
    earning.save()

    # Create a matching RecruiterPayment record
    RecruiterPayment.objects.create(
        user=request.user,
        amount=earning.amount,
        status='completed',
        description=f'Payment to {earning.freelancer.first_name or earning.freelancer.username} for "{earning.job.title}"',
    )

    # Notify freelancer
    Notification.objects.create(
        user=earning.freelancer,
        notification_type='message',
        title='Payment Approved',
        message=f'Your payment of ${earning.amount} for "{earning.job.title}" has been approved!',
        related_job=earning.job,
    )

    serializer = EarningSerializer(earning)
    return Response(serializer.data)


@api_view(['POST'])
def reject_payment_request(request, pk):
    """Recruiter rejects a freelancer's payment request."""
    if request.user.role != 'recruiter':
        return Response({'error': 'Only recruiters can reject payments'}, status=status.HTTP_403_FORBIDDEN)

    try:
        earning = Earning.objects.get(pk=pk, job__recruiter=request.user, status='pending')
    except Earning.DoesNotExist:
        return Response({'error': 'Payment request not found'}, status=status.HTTP_404_NOT_FOUND)

    earning.status = 'cancelled'
    earning.save()

    # Notify freelancer
    Notification.objects.create(
        user=earning.freelancer,
        notification_type='message',
        title='Payment Rejected',
        message=f'Your payment request of ${earning.amount} for "{earning.job.title}" was rejected.',
        related_job=earning.job,
    )

    serializer = EarningSerializer(earning)
    return Response(serializer.data)


# ─── Support Request Views ──────────────────────────────────

@api_view(['POST'])
def support_request_create(request):
    """Submit a support request."""
    serializer = SupportRequestSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def freelancer_list(request):
    """List freelancers (for task assignment dropdown)."""
    freelancers = User.objects.filter(role='freelancer').values('id', 'first_name', 'last_name', 'username')
    data = [{'id': f['id'], 'name': f"{f['first_name']} {f['last_name']}".strip() or f['username']} for f in freelancers]
    return Response(data)


# ─── Interviews ─────────────────────────────────────

@api_view(['POST'])
def schedule_interview(request):
    """Recruiter schedules an interview for an application."""
    if request.user.role != 'recruiter':
        return Response({'error': 'Only recruiters can schedule interviews'}, status=status.HTTP_403_FORBIDDEN)

    application_id = request.data.get('application_id')
    try:
        application = Application.objects.get(pk=application_id, job__recruiter=request.user)
    except Application.DoesNotExist:
        return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

    scheduled_at = request.data.get('scheduled_at')
    if not scheduled_at:
        return Response({'error': 'scheduled_at is required'}, status=status.HTTP_400_BAD_REQUEST)

    interview = Interview.objects.create(
        application=application,
        job=application.job,
        freelancer=application.freelancer,
        recruiter=request.user,
        scheduled_at=scheduled_at,
        duration_minutes=request.data.get('duration_minutes', 30),
        interview_type=request.data.get('interview_type', 'video'),
        meeting_link=request.data.get('meeting_link', ''),
        notes=request.data.get('notes', ''),
    )
    interview.refresh_from_db()

    # Update application status to reviewed
    if application.status == 'pending':
        application.status = 'reviewed'
        application.save()

    # Notify freelancer
    Notification.objects.create(
        user=application.freelancer,
        notification_type='interview_scheduled',
        title='Interview Scheduled',
        message=f'You have an interview for "{application.job.title}" on {interview.scheduled_at.strftime("%b %d, %Y at %I:%M %p")}.',
        related_job=application.job,
    )

    return Response(InterviewSerializer(interview).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def my_interviews(request):
    """Get all interviews for the current user (both roles)."""
    if request.user.role == 'recruiter':
        interviews = Interview.objects.filter(recruiter=request.user)
    else:
        interviews = Interview.objects.filter(freelancer=request.user)
    return Response(InterviewSerializer(interviews, many=True).data)


@api_view(['PUT', 'PATCH'])
def update_interview(request, pk):
    """Update an interview (reschedule, add link, cancel, complete with feedback)."""
    try:
        interview = Interview.objects.get(pk=pk)
    except Interview.DoesNotExist:
        return Response({'error': 'Interview not found'}, status=status.HTTP_404_NOT_FOUND)

    # Only recruiter or freelancer of this interview can update
    if request.user != interview.recruiter and request.user != interview.freelancer:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    try:
        data = request.data
        old_status = interview.status

        if 'scheduled_at' in data:
            interview.scheduled_at = data['scheduled_at']
        if 'duration_minutes' in data:
            interview.duration_minutes = data['duration_minutes']
        if 'interview_type' in data:
            interview.interview_type = data['interview_type']
        if 'meeting_link' in data:
            interview.meeting_link = data['meeting_link']
        if 'notes' in data:
            interview.notes = data['notes']
        if 'status' in data and data['status'] in ['scheduled', 'completed', 'cancelled']:
            interview.status = data['status']
        if 'feedback' in data:
            interview.feedback = data['feedback']
        if 'rating' in data and data['rating'] in [1, 2, 3, 4, 5]:
            interview.rating = data['rating']

        interview.save()

        # Notify on status changes
        if interview.status != old_status:
            other_user = interview.freelancer if request.user == interview.recruiter else interview.recruiter
            if interview.status == 'cancelled':
                Notification.objects.create(
                    user=other_user,
                    notification_type='interview_cancelled',
                    title='Interview Cancelled',
                    message=f'The interview for "{interview.job.title}" has been cancelled.',
                    related_job=interview.job,
                )
            elif interview.status == 'completed':
                Notification.objects.create(
                    user=other_user,
                    notification_type='interview_completed',
                    title='Interview Completed',
                    message=f'The interview for "{interview.job.title}" has been marked as completed.',
                    related_job=interview.job,
                )

        return Response(InterviewSerializer(interview).data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE', 'POST'])
def delete_interview(request, pk):
    """Delete an interview (recruiter only)."""
    if request.user.role != 'recruiter':
        return Response({'error': 'Only recruiters can delete interviews'}, status=status.HTTP_403_FORBIDDEN)
    try:
        interview = Interview.objects.get(pk=pk, recruiter=request.user)
    except Interview.DoesNotExist:
        return Response({'error': 'Interview not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        interview.delete()
        return Response({'message': 'Interview deleted'})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
