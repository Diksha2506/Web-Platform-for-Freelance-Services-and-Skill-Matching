from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import User, FreelancerProfile, RecruiterProfile, Job, Application, Earning, RecruiterPayment, Interview, Project, Task, Notification, Conversation, Message
from datetime import timedelta
import random

class Command(BaseCommand):
    help = 'Seeds a comprehensive, interconnected history between Parth (recruiter) and Diksha (freelancer)'

    def handle(self, *args, **options):
        self.stdout.write("Wiping existing workflow data...")
        [m.objects.all().delete() for m in [Job, Application, Earning, RecruiterPayment, Project, Task, Notification, Conversation, Message, Interview]]

        # 1. Fetch/Create Root Users
        diksha, _ = User.objects.get_or_create(username='Diksha25', defaults={'first_name': 'Diksha', 'last_name': 'Rade', 'email': 'diksha@gmail.com', 'role': 'freelancer'})
        parth, _ = User.objects.get_or_create(username='Parth23', defaults={'first_name': 'Parth', 'last_name': 'Rade', 'email': 'parth@gmail.com', 'role': 'recruiter'})
        
        # 2. Setup Profiles if missing
        FreelancerProfile.objects.get_or_create(user=diksha, defaults={'title': 'Senior Full Stack Developer', 'skills': ['React', 'Django', 'AWS'], 'hourly_rate': 85})
        RecruiterProfile.objects.get_or_create(user=parth, defaults={'company_name': 'Rade Technologies', 'industry': 'CleanTech'})

        parth_job_data = [
            ("Cloud Infra Setup", "Scalable cloud architecture using AWS."),
            ("Dashboard Redesign", "Modernize the UI with React and Tailwind."),
            ("Backend Optimization", "Refactor core Python APIs for efficiency."),
            ("Mobile Sync Module", "Enable real-time data sync for mobile clients.")
        ]

        now = timezone.now()
        self.stdout.write(f"Seeding 20 detailed project lifecycles over the past year...")

        for i in range(20):
            # Calculate a unique date for this specific project cycle
            creation_date = (now - timedelta(days=365)) + timedelta(days=i * 18)
            title_base, desc_base = parth_job_data[i % 4]
            title = f"{title_base} - Cycle {i+1}"

            # STEP 1: Job Posting
            job = Job.objects.create(recruiter=parth, title=title, description=desc_base, pay_per_hour=90 + (i % 3)*10, status='closed' if i < 18 else 'open')
            Job.objects.filter(pk=job.pk).update(created_at=creation_date)

            # STEP 2: Application
            app = Application.objects.create(job=job, freelancer=diksha, status='accepted' if i < 16 else 'pending' if i < 19 else 'rejected', cover_letter=f"Hi Parth, I'm the perfect fit for {title}.")
            Application.objects.filter(pk=app.pk).update(created_at=creation_date + timedelta(days=1))

            # STEP 3: Interview Lifecycle
            status_iv = 'completed' if i < 17 else 'scheduled'
            iv_date = creation_date + timedelta(days=3)
            if i == 19: iv_date = now + timedelta(days=1) # One upcoming interview tomorrow
            
            iv = Interview.objects.create(application=app, job=job, freelancer=diksha, recruiter=parth, scheduled_at=iv_date, status=status_iv, notes="Very technical candidate.")
            Interview.objects.filter(pk=iv.pk).update(created_at=creation_date + timedelta(days=2))
            
            # Interview Notification
            Notification.objects.create(user=diksha, title="Interview Scheduled", message=f"Parth invited you for {title}", notification_type='message', related_job=job, created_at=creation_date + timedelta(days=2))

            # STEP 4: Project & Hired Workflow
            if app.status == 'accepted':
                # Hired Notification
                Notification.objects.create(user=diksha, title="You're Hired!", message=f"Parth accepted your proposal for {title}", notification_type='application_accepted', related_job=job, created_at=creation_date + timedelta(days=4))
                
                project = Project.objects.create(client=parth, title=f"Active: {title}", status='completed' if i < 14 else 'active', progress=100 if i < 14 else 45, deadline=creation_date.date() + timedelta(days=45))
                Project.objects.filter(pk=project.pk).update(created_at=creation_date + timedelta(days=5))

                Task.objects.create(project=project, title="Core Logic Implementation", assigned_to=diksha, is_completed=(i < 14), due_date=project.deadline)

                # STEP 5: Payment Flow
                amount = 2000 + (i * 200)
                is_paid = i < 13
                
                # Payment Request (Earning)
                earning = Earning.objects.create(freelancer=diksha, job=job, application=app, amount=amount, status='paid' if is_paid else 'pending', description=f"Milestone {i+1} for {title}")
                Earning.objects.filter(pk=earning.pk).update(created_at=creation_date + timedelta(days=20), paid_at=(creation_date + timedelta(days=21)) if is_paid else None)

                # Recruiter outgoing record
                pay = RecruiterPayment.objects.create(user=parth, amount=amount, status='completed' if is_paid else 'pending', description=f"Payment to Diksha for {title}")
                RecruiterPayment.objects.filter(pk=pay.pk).update(created_at=creation_date + timedelta(days=20))

                # Payment Notification
                if is_paid:
                    Notification.objects.create(user=diksha, title="Payment Received", message=f"You received ${amount} for {title}", notification_type='message', related_job=job, created_at=creation_date + timedelta(days=21))

            # STEP 6: Real-time Messages
            conv, _ = Conversation.objects.get_or_create(application=app, freelancer=diksha, recruiter=parth, job=job)
            Message.objects.create(conversation=conv, sender=parth, content=f"Let's start the work on {title}!")
            Message.objects.create(conversation=conv, sender=diksha, content="Absolutely, starting the initial setup now.")

        # Ensure active notifications for today
        Notification.objects.create(user=diksha, title="New Payment Request Approved", message="Parth has approved your latest payment request.", notification_type='message', created_at=now)
        Notification.objects.create(user=parth, title="New Proposal Received", message="Diksha submitted a proposal for Server Security Review.", notification_type='application_received', created_at=now)

        self.stdout.write(self.style.SUCCESS("Database is now fully populated with a coordinated 1-year history between Parth and Diksha."))
