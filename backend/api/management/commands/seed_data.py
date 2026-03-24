from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import (
    User, FreelancerProfile, RecruiterProfile, Job, Application,
    Notification, Conversation, Message, Earning,
    Project, Task, Meeting, RecruiterPayment
)
import random
from decimal import Decimal

class Command(BaseCommand):
    help = 'Seed the database with sample data'

    def handle(self, *args, **options):
        self.stdout.write("Seeding data...")

        # 1. Create/Get Key Users
        diksha, _ = User.objects.get_or_create(
            username='Diksha25',
            defaults={
                'email': 'diksha@example.com',
                'first_name': 'Diksha',
                'last_name': 'Sharma',
                'role': 'recruiter',
                'location': 'New Delhi, India',
                'bio': 'Experienced Tech Recruiter looking for elite freelancers.'
            }
        )
        diksha.set_password('password123')
        diksha.save()
        RecruiterProfile.objects.get_or_create(user=diksha, defaults={'company_name': 'D-Tech Solutions', 'industry': 'Technology', 'company_size': '50-100'})

        parth, _ = User.objects.get_or_create(
            username='Parth25',
            defaults={
                'email': 'parth@example.com',
                'first_name': 'Parth',
                'last_name': 'Verma',
                'role': 'freelancer',
                'location': 'Mumbai, India',
                'bio': 'Full-stack Developer with 5 years of experience in React and Django.'
            }
        )
        parth.set_password('password123')
        parth.save()
        FreelancerProfile.objects.get_or_create(
            user=parth, 
            defaults={
                'title': 'Senior Full-Stack Developer', 
                'skills': ['React', 'Django', 'PostgreSQL', 'Python'],
                'hourly_rate': Decimal('45.00'),
                'experience_level': 'expert',
                'years_of_experience': 5
            }
        )

        # Create some other users for variety
        other_recruiters = []
        for i in range(3):
            u, _ = User.objects.get_or_create(
                username=f'Recruiter{i}',
                defaults={'role': 'recruiter', 'first_name': f'Recruiter_{i}'}
            )
            u.set_password('password123')
            u.save()
            RecruiterProfile.objects.get_or_create(user=u, defaults={'company_name': f'Company {i}'})
            other_recruiters.append(u)

        other_freelancers = []
        for i in range(5):
            u, _ = User.objects.get_or_create(
                username=f'Freelancer{i}',
                defaults={'role': 'freelancer', 'first_name': f'Freelancer_{i}'}
            )
            u.set_password('password123')
            u.save()
            FreelancerProfile.objects.get_or_create(user=u, defaults={'title': f'Developer {i}', 'skills': ['JavaScript', 'Python']})
            other_freelancers.append(u)

        # 2. Add 20 Jobs
        job_titles = [
            "React Frontend Developer", "Django Backend Specialist", "Full-Stack Web Architect",
            "Mobile App Developer (Flutter)", "UI/UX Designer for Web App", "DevOps Engineer for Cloud Setup",
            "Python Data Analyst", "E-commerce Website Builder", "GraphQL Integration Expert",
            "Next.js Portfolio Site", "REST API Developer", "Database Optimization Guru",
            "Cybersecurity Consultant", "SEO Optimization Specialist", "Content Management System Admin",
            "Cloud Migration Expert", "Automated Testing Engineer", "AI Model Deployment Expert",
            "Blockchain Smart Contract Dev", "DevSecOps Lead"
        ]

        jobs = []
        for i, title in enumerate(job_titles):
            recruiter = diksha if i % 2 == 0 else random.choice(other_recruiters)
            job, _ = Job.objects.get_or_create(
                title=title,
                recruiter=recruiter,
                defaults={
                    'description': f"This is a sample description for {title}. We need an expert who can deliver high quality work within deadlines.",
                    'required_skills': ['Python', 'JavaScript'] if i % 3 == 0 else ['React', 'CSS'],
                    'pay_per_hour': Decimal(random.randint(20, 100)),
                    'experience_level': random.choice(['entry', 'intermediate', 'expert']),
                    'job_type': random.choice(['full_time', 'part_time', 'contract', 'freelance']),
                    'status': 'open' if i < 18 else 'closed'
                }
            )
            jobs.append(job)

        # 3. Add Applications
        # Parth25 applies to some of Diksha's and others' jobs
        for i, job in enumerate(jobs[:10]):
            status = 'pending'
            if i == 0: status = 'accepted'
            if i == 1: status = 'reviewed'
            if i == 2: status = 'rejected'

            app, created = Application.objects.get_or_create(
                job=job,
                freelancer=parth,
                defaults={
                    'cover_letter': f"Hi, I am interested in {job.title}. I have relevant experience in this stack.",
                    'proposed_rate': job.pay_per_hour,
                    'status': status
                }
            )
            if created:
                job.applicants_count += 1
                job.save()

        # Other freelancers apply too
        for job in jobs[10:15]:
            for freelancer in random.sample(other_freelancers, 2):
                app, created = Application.objects.get_or_create(
                    job=job,
                    freelancer=freelancer,
                    defaults={'cover_letter': "I'm the best for this job."}
                )
                if created:
                    job.applicants_count += 1
                    job.save()

        # 4. Conversations & Messages
        accepted_app = Application.objects.filter(freelancer=parth, status='accepted').first()
        if accepted_app:
            convo, _ = Conversation.objects.get_or_create(
                application=accepted_app,
                defaults={
                    'freelancer': parth,
                    'recruiter': accepted_app.job.recruiter,
                    'job': accepted_app.job
                }
            )
            # Create messages but don't duplicate on multiple runs
            if not Message.objects.filter(conversation=convo).exists():
                Message.objects.create(conversation=convo, sender=parth, content="Hi Diksha, thanks for accepting my application!")
                Message.objects.create(conversation=convo, sender=diksha, content="Welcome Parth! Looking forward to working together.")
                Message.objects.create(conversation=convo, sender=diksha, content="Can we discuss the project timeline?")

        # 5. Projects & Tasks
        if accepted_app:
            project, _ = Project.objects.get_or_create(
                client=diksha,
                title=f"Project: {accepted_app.job.title}",
                defaults={
                    'description': "Full implementation of the requested features.",
                    'status': 'active',
                    'planned_hours': Decimal('40.0'),
                    'progress': 25
                }
            )
            Task.objects.get_or_create(project=project, title="Initial Setup", defaults={'assigned_to': parth, 'is_completed': True, 'hours': Decimal('5.0')})
            Task.objects.get_or_create(project=project, title="Frontend Components", defaults={'assigned_to': parth, 'is_completed': False, 'hours': Decimal('15.0')})
            
            Meeting.objects.get_or_create(
                project=project,
                topic="Kickoff Meeting",
                defaults={'timing': timezone.now() + timezone.timedelta(days=1), 'description': "Discussing project requirements."}
            )

        # 6. Earnings for Parth
        if accepted_app:
            Earning.objects.get_or_create(
                freelancer=parth,
                job=accepted_app.job,
                application=accepted_app,
                description="Phase 1: Initial Setup",
                defaults={
                    'amount': Decimal('225.00'),
                    'hours_worked': Decimal('5.0'),
                    'status': 'paid',
                    'paid_at': timezone.now()
                }
            )
            Earning.objects.get_or_create(
                freelancer=parth,
                job=accepted_app.job,
                application=accepted_app,
                description="Phase 2: Ongoing development",
                defaults={
                    'amount': Decimal('450.00'),
                    'hours_worked': Decimal('10.0'),
                    'status': 'pending'
                }
            )

        # 7. Notifications
        Notification.objects.create(user=parth, notification_type='application_accepted', title='Application Accepted', message=f'Your application for {jobs[0].title} was accepted!', related_job=jobs[0])
        Notification.objects.create(user=diksha, notification_type='application_received', title='New Application', message=f'Parth25 applied for {jobs[5].title}', related_job=jobs[5])

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with real-world sample data!'))
