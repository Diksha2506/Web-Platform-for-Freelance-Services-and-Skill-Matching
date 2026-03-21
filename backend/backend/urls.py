from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static

# Simple working homepage (prevents 500 error)
def home(request):
    return HttpResponse("Backend is running 🚀")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),

    # ✅ ROOT FIX (no template dependency)
    path('', home),
]

# Serve media files (safe)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)