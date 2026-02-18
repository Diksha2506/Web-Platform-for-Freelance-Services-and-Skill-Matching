from django.db import models
from django.conf import settings

class Job(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=200)
    title = models.CharField(max_length=200)
    bio = models.TextField()
    skills = models.CharField(max_length=300)

    def __str__(self):
        return self.full_name

