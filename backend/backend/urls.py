from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),

    # Serve the React frontend for all other paths
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]

# Serve media files (safe)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)