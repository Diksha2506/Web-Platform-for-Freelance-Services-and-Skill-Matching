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
    help = 'Seed the database with sample data, including parth23 as a recruiter with 20 jobs'

    def handle(self, *args, **options):
        self.stdout.write("Seeding data...")

        # 1. Create/Get parth23 (Recruiter)
        parth23, created = User.objects.get_or_create(
            username='parth23',
            defaults={
                'email': 'parth23@example.com',
                'first_name': 'Parth',
                'last_name': 'Verma',
                'role': 'recruiter',
                'location': 'Mumbai, India',
                'bio': 'Senior Tech Recruiter specialized in hiring top-tier software engineers and designers.'
            }
        )
        parth23.set_password('password123')
        parth23.save()
        
        RecruiterProfile.objects.update_or_create(
            user=parth23, 
            defaults={
                'company_name': 'Parth Tech Solutions', 
                'industry': 'Software Development', 
                'company_size': '200-500',
                'company_website': 'https://parthtech.example.com'
            }
        )

        # 2. Add 20 Realistic Jobs for parth23
        realistic_jobs = [
            {
                "title": "Senior React.js Developer",
                "description": "We are seeking an expert React developer to lead the development of our core dashboard. Must have experience with Redux Toolkit and Framer Motion.",
                "required_skills": ["React", "Redux", "Framer Motion", "Tailwind CSS"],
                "pay": 65,
                "level": "expert",
                "type": "contract"
            },
            {
                "title": "Django Backend Architect",
                "description": "Looking for a seasoned Django developer to design and implement complex API architectures and database schemas using PostgreSQL.",
                "required_skills": ["Django", "Python", "PostgreSQL", "DRF"],
                "pay": 70,
                "level": "expert",
                "type": "full_time"
            },
            {
                "title": "Flutter Mobile App Specialist",
                "description": "Need a cross-platform mobile developer to build a high-performance e-commerce app with Flutter. Experience with Firebase and Bloc is a plus.",
                "required_skills": ["Flutter", "Dart", "Firebase", "Bloc"],
                "pay": 55,
                "level": "intermediate",
                "type": "freelance"
            },
            {
                "title": "UI/UX Product Designer",
                "description": "Join our creative team to design modern, user-centric interfaces for our upcoming SaaS product. Mastery of Figma and Adobe XD is required.",
                "required_skills": ["Figma", "UI Design", "UX Research", "Prototyping"],
                "pay": 50,
                "level": "intermediate",
                "type": "part_time"
            },
            {
                "title": "DevOps Engineer (AWS Cloud)",
                "description": "Help us automate our deployment pipelines and manage our cloud infrastructure on AWS. Strong experience with Docker and Kubernetes needed.",
                "required_skills": ["AWS", "Docker", "Kubernetes", "CI/CD"],
                "pay": 80,
                "level": "expert",
                "type": "contract"
            },
            {
                "title": "Data Scientist - Machine Learning",
                "description": "Analyze large datasets and build predictive models to enhance our customer insights engine. Proficiency in Python and Scikit-learn is essential.",
                "required_skills": ["Python", "TensorFlow", "Pandas", "Statistical Analysis"],
                "pay": 75,
                "level": "expert",
                "type": "full_time"
            },
            {
                "title": "Full-Stack MERN Developer",
                "description": "Work on both frontend and backend of our internal tools. Familiarity with Node.js, Express, and MongoDB is a must.",
                "required_skills": ["MongoDB", "Express", "React", "Node.js"],
                "pay": 45,
                "level": "intermediate",
                "type": "freelance"
            },
            {
                "title": "Cybersecurity Consultant",
                "description": "Perform security audits and implement robust protection measures for our financial application. Expertise in network security required.",
                "required_skills": ["Penetration Testing", "Network Security", "Risk Assessment"],
                "pay": 90,
                "level": "expert",
                "type": "contract"
            },
            {
                "title": "Blockchain/Solidity Developer",
                "description": "Develop and deploy smart contracts for our decentralized finance (DeFi) project. Strong understanding of Ethereum and Web3.js.",
                "required_skills": ["Solidity", "Ethereum", "Web3.js", "Truffle"],
                "pay": 85,
                "level": "expert",
                "type": "freelance"
            },
            {
                "title": "AI/ML Engineer (PyTorch focus)",
                "description": "Implement cutting-edge computer vision algorithms using PyTorch. Experience with GANs and image processing is preferred.",
                "required_skills": ["PyTorch", "Computer Vision", "Deep Learning"],
                "pay": 80,
                "level": "expert",
                "type": "full_time"
            },
            {
                "title": "Technical Product Manager",
                "description": "Bridge the gap between business requirements and technical implementation. Lead agile sprints and define product roadmaps.",
                "required_skills": ["Agile", "Scrum", "Jira", "Stakeholder Management"],
                "pay": 60,
                "level": "intermediate",
                "type": "full_time"
            },
            {
                "title": "QA Automation Engineer",
                "description": "Ensure the quality of our web applications by building automated test suites with Selenium and Cypress.",
                "required_skills": ["Selenium", "Cypress", "JavaScript", "Automation Testing"],
                "pay": 40,
                "level": "intermediate",
                "type": "contract"
            },
            {
                "title": "SEO & Digital Search Specialist",
                "description": "Optimize our online presence to drive organic traffic. Strong knowledge of Google Search Console and keyword research tools.",
                "required_skills": ["SEO", "Google Analytics", "Keyword Research"],
                "pay": 35,
                "level": "entry",
                "type": "freelance"
            },
            {
                "title": "Content Strategy Specialist",
                "description": "Develop and manage our content pipeline across all channels. Excellent writing skills and marketing knowledge requested.",
                "required_skills": ["Content Marketing", "Copywriting", "Branding"],
                "pay": 30,
                "level": "entry",
                "type": "part_time"
            },
            {
                "title": "Technical Writer (API Documentation)",
                "description": "Create clear and concise documentation for our public APIs and developer portals. Familiarity with Swagger/OpenAPI is needed.",
                "required_skills": ["Technical Writing", "Swagger", "Markdown", "Git"],
                "pay": 40,
                "level": "intermediate",
                "type": "contract"
            },
            {
                "title": "Frontend Architect (Next.js/TS)",
                "description": "Design the frontend architecture for our large-scale enterprise application using Next.js and TypeScript.",
                "required_skills": ["Next.js", "TypeScript", "Architectural Design"],
                "pay": 75,
                "level": "expert",
                "type": "contract"
            },
            {
                "title": "Database Admin (PostgreSQL)",
                "description": "Manage our database clusters, ensure high availability, and perform performance tuning on massive datasets.",
                "required_skills": ["PostgreSQL", "Database Tuning", "Linux", "Optimization"],
                "pay": 65,
                "level": "expert",
                "type": "full_time"
            },
            {
                "title": "Cloud Architect (Azure Solutions)",
                "description": "Design and oversee our migration to Azure Cloud. Implementation of IaaS and PaaS solutions.",
                "required_skills": ["Azure", "Cloud Architecture", "Identity Management"],
                "pay": 85,
                "level": "expert",
                "type": "contract"
            },
            {
                "title": "Graphic Designer (Visual Branding)",
                "description": "Create stunning visual assets for our brand identity, including logos, social media graphics, and marketing materials.",
                "required_skills": ["Adobe Illustrator", "Photoshop", "Branding", "Layout Design"],
                "pay": 35,
                "level": "entry",
                "type": "freelance"
            },
            {
                "title": "Mobile App UI/UX Designer",
                "description": "Specialize in designing engaging and intuitive mobile experiences for iOS and Android platforms.",
                "required_skills": ["Mobile Design", "Prototyping", "User Interaction"],
                "pay": 48,
                "level": "intermediate",
                "type": "freelance"
            }
        ]

        # Clear existing jobs if needed or just add new ones
        # For simplicity, we'll just add them. If they exist, get_or_create handles it.
        
        for job_data in realistic_jobs:
            Job.objects.get_or_create(
                title=job_data["title"],
                recruiter=parth23,
                defaults={
                    'description': job_data["description"],
                    'required_skills': job_data["required_skills"],
                    'pay_per_hour': Decimal(str(job_data["pay"])),
                    'experience_level': job_data["level"],
                    'job_type': job_data["type"],
                    'status': 'open',
                    'location': random.choice(['Remote', 'Mumbai, IN', 'Bangalore, IN', 'New York, US', 'London, UK'])
                }
            )

        # 3. Create a Freelancer (Parth25) to see these jobs
        parth_freelancer, _ = User.objects.get_or_create(
            username='Parth25',
            defaults={
                'email': 'parth25@example.com',
                'first_name': 'Parth',
                'last_name': 'Freelancer',
                'role': 'freelancer',
                'location': 'Bangalore, India',
                'bio': 'Experienced Full-stack developer looking for exciting projects.'
            }
        )
        parth_freelancer.set_password('password123')
        parth_freelancer.save()
        
        FreelancerProfile.objects.update_or_create(
            user=parth_freelancer,
            defaults={
                'title': 'Senior Full-Stack Developer',
                'skills': ['React', 'Python', 'Django', 'Node.js'],
                'hourly_rate': Decimal('45.00'),
                'experience_level': 'expert',
                'years_of_experience': 7
            }
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with 20 realistic jobs for parth23!'))
