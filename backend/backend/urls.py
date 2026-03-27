from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),

    # React frontend (root and catch-all for routing)
    path('', TemplateView.as_view(template_name='index.html')),
    re_path(r'^(?!static/).*$', TemplateView.as_view(template_name='index.html')),
]

# Serve media files (safe)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)