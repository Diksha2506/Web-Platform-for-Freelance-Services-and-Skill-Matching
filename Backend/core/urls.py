from django.urls import path
from .views import JobListCreateView, ProfileDetailView

urlpatterns = [
    path('jobs/', JobListCreateView.as_view(), name='jobs'),
    path('profile/<int:pk>/', ProfileDetailView.as_view(), name='profile'),
]
