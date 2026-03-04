from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    JobListCreateView,
    JobDetailView,
    ProfileDetailView,
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    RefreshTokenView,
    DashboardSummaryView,
    DashboardJobsView,
    DashboardMessagesView,
    MessageThreadListView,
    MessageListCreateView,
    PaymentSummaryView,
    PaymentTransactionListView,
    ProjectListCreateView,
    ProjectDetailView,
    TaskCreateView,
    MeetingListCreateView,
    SupportRequestCreateView,
    FreelancerListView,
    ProposalListCreateView,
    ProposalDetailView,
    ReviewListCreateView,
)

urlpatterns = [
    # Jobs & profile
    path("jobs/", JobListCreateView.as_view(), name="jobs"),
    path("jobs/<int:pk>/", JobDetailView.as_view(), name="job-detail"),
    path("profile/freelancers/", FreelancerListView.as_view(), name="freelancer-list"),
    path("profile/<int:pk>/", ProfileDetailView.as_view(), name="profile"),

    # Auth
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("auth/token/refresh/", RefreshTokenView.as_view(), name="token-refresh"),

    # Dashboard
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("dashboard/jobs/", DashboardJobsView.as_view(), name="dashboard-jobs"),
    path("dashboard/messages/", DashboardMessagesView.as_view(), name="dashboard-messages"),

    # Messages
    path("messages/threads/", MessageThreadListView.as_view(), name="messages-threads"),
    path("messages/", MessageListCreateView.as_view(), name="messages"),

    # Payments
    path("payments/summary/", PaymentSummaryView.as_view(), name="payments-summary"),
    path("payments/transactions/", PaymentTransactionListView.as_view(), name="payments-transactions"),
    
    # Projects
    path("projects/", ProjectListCreateView.as_view(), name="projects"),
    path("projects/<int:pk>/", ProjectDetailView.as_view(), name="project-detail"),
    path("tasks/", TaskCreateView.as_view(), name="task-create"),
    path("meetings/", MeetingListCreateView.as_view(), name="meeting-list-create"),
    path("support/", SupportRequestCreateView.as_view(), name="support-create"),

    # Proposals
    path("proposals/", ProposalListCreateView.as_view(), name="proposals"),
    path("proposals/<int:pk>/", ProposalDetailView.as_view(), name="proposal-detail"),

    # Reviews
    path("reviews/", ReviewListCreateView.as_view(), name="review-list-create"),
]
