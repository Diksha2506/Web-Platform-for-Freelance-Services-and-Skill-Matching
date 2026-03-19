from django.urls import path
from . import views

urlpatterns = [
    # CSRF
    path('csrf/', views.csrf_token_view, name='csrf_token'),
    
    # Auth
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/user/', views.current_user, name='current_user'),
    path('auth/profile/', views.update_profile, name='update_profile'),

    # Jobs
    path('jobs/', views.job_list, name='job_list'),
    path('jobs/create/', views.create_job, name='create_job'),
    path('jobs/my/', views.my_jobs, name='my_jobs'),
    path('jobs/<int:pk>/', views.job_detail, name='job_detail'),
    path('jobs/<int:pk>/update/', views.update_job, name='update_job'),
    path('jobs/<int:pk>/delete/', views.delete_job, name='delete_job'),

    # Applications
    path('jobs/<int:pk>/apply/', views.apply_job, name='apply_job'),
    path('jobs/<int:pk>/applications/', views.job_applications, name='job_applications'),
    path('applications/my/', views.my_applications, name='my_applications'),
    path('applications/<int:pk>/status/', views.update_application_status, name='update_application_status'),

    # Notifications
    path('notifications/', views.notifications, name='notifications'),
    path('notifications/<int:pk>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('notifications/read-all/', views.mark_all_notifications_read, name='mark_all_notifications_read'),

    # Dashboard
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),

    # Messages / Chat
    path('conversations/', views.conversation_list, name='conversation_list'),
    path('conversations/<int:pk>/messages/', views.conversation_messages, name='conversation_messages'),
    path('conversations/<int:pk>/send/', views.send_message, name='send_message'),
    path('conversations/start/<int:application_id>/', views.start_conversation, name='start_conversation'),

    # Earnings / Payments (Freelancer)
    path('earnings/', views.earnings_list, name='earnings_list'),
    path('earnings/stats/', views.earnings_stats, name='earnings_stats'),
    path('earnings/request/', views.request_payment, name='request_payment'),

    # Projects
    path('projects/', views.project_list_create, name='project_list_create'),
    path('projects/<int:pk>/', views.project_detail, name='project_detail'),
    path('projects/<int:project_id>/tasks/', views.task_create, name='task_create'),
    path('projects/<int:project_id>/meetings/', views.meeting_create, name='meeting_create'),
    path('tasks/<int:pk>/toggle/', views.task_toggle, name='task_toggle'),

    # Freelancer Projects
    path('freelancer/projects/', views.freelancer_projects, name='freelancer_projects'),
    path('freelancer/projects/<int:pk>/', views.freelancer_project_detail, name='freelancer_project_detail'),

    # Recruiter Payments
    path('payments/summary/', views.recruiter_payment_summary, name='recruiter_payment_summary'),
    path('payments/transactions/', views.recruiter_payment_transactions, name='recruiter_payment_transactions'),
    path('payments/requests/', views.recruiter_payment_requests, name='recruiter_payment_requests'),
    path('payments/requests/<int:pk>/approve/', views.approve_payment_request, name='approve_payment_request'),
    path('payments/requests/<int:pk>/reject/', views.reject_payment_request, name='reject_payment_request'),

    # Support
    path('support/', views.support_request_create, name='support_request_create'),

    # Freelancers list
    path('freelancers/', views.freelancer_list, name='freelancer_list'),

    # Interviews
    path('interviews/', views.my_interviews, name='my_interviews'),
    path('interviews/schedule/', views.schedule_interview, name='schedule_interview'),
    path('interviews/<int:pk>/', views.update_interview, name='update_interview'),
    path('interviews/<int:pk>/delete/', views.delete_interview, name='delete_interview'),
]
