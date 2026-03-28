from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),

    # Serve media files explicitly (works with DEBUG=False for Render ephemeral disk)
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

# Static files are handled by WhiteNoise, but we can keep this for dev
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# React frontend (root and catch-all for routing)
# ONLY append this AT THE VERY END so it doesn't intercept /media/ or /api/
urlpatterns += [
    path('', TemplateView.as_view(template_name='index.html')),
    re_path(r'^(?!static/|media/).*$', TemplateView.as_view(template_name='index.html')),
]