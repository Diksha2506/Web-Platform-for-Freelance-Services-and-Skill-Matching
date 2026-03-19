# TalentLink

TalentLink is a full-stack freelancing platform built with React and Django. It connects recruiters and freelancers in a single workflow that covers job posting, applications, interviews, messaging, project collaboration, earnings, payments, and notifications.

The application provides separate role-based dashboards for recruiters and freelancers, with each dashboard focused on the work that role needs to do day to day.

## Features

### Authentication and Role Management
- User registration and login
- Session-based authentication
- Role-based access for `recruiter` and `freelancer`
- Protected dashboard routes for each role

### Recruiter Features
- Create and manage job posts
- View applications for posted jobs
- Accept or reject candidates
- Start direct conversations with applicants
- Schedule, update, cancel, complete, and delete interviews
- Create and manage projects
- Add tasks and assign freelancers
- Schedule project meetings
- Review payment requests
- Approve or reject freelancer payments
- Manage company profile
- Read in-app notifications
- Submit support requests

### Freelancer Features
- Browse and search jobs
- Apply to jobs with cover letter and proposed rate
- Track application status
- View interviews and join meeting links
- Read in-app notifications
- View earnings and payment stats
- Request payments for accepted work
- Access assigned projects
- Track tasks and meetings
- Use direct messaging with recruiters
- Manage personal profile
- Submit support requests

### Communication and Workflow Features
- Real-time style messaging flow via conversation threads
- Interview scheduling with date, duration, type, meeting link, and notes
- Notification system for applications, messages, interviews, and payments
- Recruiter payment tracking and freelancer earnings tracking
- Project progress tracking based on task completion

## Tech Stack

### Frontend
- React 18
- React Router
- Axios
- Framer Motion
- Chart.js
- React Hot Toast
- Lucide React
- React Icons

### Backend
- Django 6
- Django REST Framework
- django-cors-headers
- SQLite
- Pillow
- python-dotenv

## Project Structure

```text
frrelancer appli new/
|- backend/
|  |- api/
|  |- backend/
|  |- manage.py
|  |- db.sqlite3
|  |- requirements.txt
|  |- .env
|  `- venv/
|- frontend/
|  |- public/
|  |- src/
|  |- package.json
|  |- package-lock.json
|  `- build/
|- .venv/
`- README.md
```

## Backend Domain Models

The backend is centered around these main models:

- `User`
- `FreelancerProfile`
- `RecruiterProfile`
- `Job`
- `Application`
- `Notification`
- `Conversation`
- `Message`
- `Project`
- `Task`
- `Meeting`
- `RecruiterPayment`
- `SupportRequest`
- `Earning`
- `Interview`

These models support the full recruiter-to-freelancer workflow from hiring through delivery and payment.

## Frontend Pages

### Public Pages
- Landing page
- Login page
- Register page

### Recruiter Dashboard Areas
- Dashboard overview
- Job listings
- Post a job
- Interviews
- Projects
- Messages
- Payments
- Notifications
- Company profile
- Help center

### Freelancer Dashboard Areas
- Overview
- Browse jobs
- My applications
- Earnings
- Interviews
- Projects
- Messages
- Notifications
- My profile
- Help center

## API Overview

All API routes are available under `/api/`.

### Authentication
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/auth/user/`
- `PUT /api/auth/profile/`

### Jobs
- `GET /api/jobs/`
- `POST /api/jobs/create/`
- `GET /api/jobs/my/`
- `GET /api/jobs/<id>/`
- `PUT /api/jobs/<id>/update/`
- `DELETE /api/jobs/<id>/delete/`

### Applications
- `POST /api/jobs/<id>/apply/`
- `GET /api/jobs/<id>/applications/`
- `GET /api/applications/my/`
- `PUT /api/applications/<id>/status/`

### Notifications
- `GET /api/notifications/`
- `PUT /api/notifications/<id>/read/`
- `PUT /api/notifications/read-all/`

### Dashboard
- `GET /api/dashboard/stats/`

### Messaging
- `GET /api/conversations/`
- `POST /api/conversations/start/<application_id>/`
- `GET /api/conversations/<id>/messages/`
- `POST /api/conversations/<id>/send/`

### Earnings and Payments
- `GET /api/earnings/`
- `GET /api/earnings/stats/`
- `POST /api/earnings/request/`
- `GET /api/payments/summary/`
- `GET /api/payments/transactions/`
- `GET /api/payments/requests/`
- `POST /api/payments/requests/<id>/approve/`
- `POST /api/payments/requests/<id>/reject/`

### Projects
- `GET /api/projects/`
- `POST /api/projects/`
- `GET /api/projects/<id>/`
- `PUT /api/projects/<id>/`
- `DELETE /api/projects/<id>/`
- `POST /api/projects/<project_id>/tasks/`
- `PUT /api/tasks/<id>/toggle/`
- `POST /api/projects/<project_id>/meetings/`
- `GET /api/freelancer/projects/`
- `GET /api/freelancer/projects/<id>/`

### Interviews
- `GET /api/interviews/`
- `POST /api/interviews/schedule/`
- `PUT /api/interviews/<id>/`
- `DELETE /api/interviews/<id>/delete/`

### Support
- `POST /api/support/`

### Utility
- `GET /api/csrf/`
- `GET /api/freelancers/`

## Local Development Setup

## Prerequisites
- Python 3.12+
- Node.js 18+
- npm

## 1. Clone the repository

```bash
git clone https://github.com/Nitishv06/TalentLink.git
cd "frrelancer appli new"
```

## 2. Backend setup

If you are using the backend virtual environment inside `backend/`:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

If you are using the root virtual environment instead:

```bash
cd backend
..\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

Backend runs at:

```text
http://localhost:8000
```

## 3. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
npm start
```

Frontend runs at:

```text
http://localhost:3000
```

The frontend is configured to proxy API requests to the backend server.

## Environment Configuration

Backend settings are loaded from:

```text
backend/.env
```

Typical variables:

```env
SECRET_KEY=your-secret-key
DEBUG=True
```

Current development setup uses:
- SQLite database
- open CORS configuration for local development
- session authentication
- console email backend

## Development Notes

- The backend uses a custom `User` model
- Authentication is session-based rather than token-based
- CSRF support is available through `/api/csrf/`
- Media files are stored under `backend/media/`
- SQLite is used for development by default
- Charts are used in dashboards for activity, spending, and earnings views

## Main Workflows

### Recruiter Workflow
1. Register as a recruiter
2. Create a company profile
3. Post jobs
4. Review applicants
5. Accept or reject applications
6. Start conversations
7. Schedule interviews
8. Create projects and tasks for hired freelancers
9. Review payment requests
10. Approve payments and track spending

### Freelancer Workflow
1. Register as a freelancer
2. Complete profile information
3. Browse and search jobs
4. Apply with cover letter and proposed rate
5. Track application status
6. Attend scheduled interviews
7. Work on assigned projects
8. Request payments
9. Track earnings and completed work

## Known Development Characteristics

- Designed primarily for local development right now
- Uses SQLite instead of PostgreSQL in the current setup
- Email sending is currently configured for development output
- Session auth and frontend proxy are configured for local browser use

## Future Improvements

- Production deployment configuration
- Background tasks for email and notifications
- Real-time chat with WebSockets
- File uploads for proposals and messages
- Automated test coverage expansion
- Admin reporting and analytics
- Cloud-ready database and storage integration

## License

No explicit license file is currently included in the repository. Add one if you plan to distribute or open-source the project formally.