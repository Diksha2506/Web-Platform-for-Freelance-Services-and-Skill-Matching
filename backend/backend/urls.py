from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static

# Simple test view
def home(request):
    return HttpResponse("Backend is running 🚀")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),

    # ✅ FIX: root route (no template dependency)
    path('', home),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)