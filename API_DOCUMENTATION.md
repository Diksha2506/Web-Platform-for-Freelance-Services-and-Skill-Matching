# SkillBridge REST API Documentation

This is a comprehensive production-ready REST API for the SkillBridge Freelance Services & Skill Matching Platform.

## 🚀 Features

### Authentication & Authorization
- ✅ JWT Token-based authentication via HttpOnly cookies
- ✅ User registration with role-based system (Client/Freelancer)
- ✅ Login with automatic profile creation
- ✅ Logout with token blacklisting
- ✅ Token refresh endpoint
- ✅ Current user information endpoint (`/auth/me/`)

### Jobs & Projects
- ✅ Create, list, and manage jobs
- ✅ Filter jobs by type, experience level, and category
- ✅ Search jobs by title, description, and skills
- ✅ Create and manage projects
- ✅ Track project progress and deadlines
- ✅ Attach tasks and meetings to projects

### Messaging System
- ✅ Send and receive messages between users
- ✅ Message threads view
- ✅ Conversation history

### Payments & Transactions
- ✅ Payment tracking and summary
- ✅ Transaction history with status
- ✅ Multiple payment statuses (completed, pending, escrow)

### Proposals & Reviews
- ✅ Submit proposals for jobs
- ✅ Manage proposal status (pending, interview, accepted, rejected)
- ✅ Rate and review freelancers
- ✅ Rating validation (1-5 stars)

### Support System
- ✅ Support request submission
- ✅ Subject and message validation
- ✅ User-specific support ticket tracking

### Dashboard & Analytics
- ✅ Summary statistics (active projects, proposals, spending, hires)
- ✅ Dashboard-specific data views
- ✅ Role-based dashboard (Client vs Freelancer)

### API Documentation
- ✅ Interactive Swagger UI at `/api/docs/`
- ✅ ReDoc documentation at `/api/redoc/`
- ✅ OpenAPI schema at `/api/schema/`

## 📊 Advanced Features

### Pagination
- Default page size: 20 items per page
- Query parameter: `?page=1`
- Automatic pagination on all list endpoints

### Filtering
- Filter by multiple fields on list endpoints
- Example: `/api/jobs/?job_type=freelance&is_active=true`

### Search
- Full-text search on text fields
- Example: `/api/jobs/?search=python&django`

### Ordering
- Sort results by specified fields
- Example: `/api/jobs/?ordering=-budget,-created_at`

### Response Format
All successful responses follow this format:
```json
{
  "success": true,
  "detail": "Success message",
  "data": { ... }
}

Error responses:
{
  "success": false,
  "detail": "Error message",
  "errors": {
    "field_name": ["error detail"]
  }
}
```

### Rate Limiting
- Anonymous users: 100 requests/hour
- Authenticated users: 1000 requests/hour

### Validation
- All inputs are validated before processing
- Detailed error messages for validation failures
- Consistent error response format

## 🔐 Security Features

1. **CORS Protection**: Configured for frontend communication
2. **CSRF Protection**: Enabled for session-based requests
3. **Rate Limiting**: Throttle abuse attempts
4. **Input Validation**: All fields validated with custom rules
5. **Authentication**: JWT tokens with cookie storage
6. **Permissions**: Role-based access control

## 📚 API Endpoints

### Authentication
```
POST   /api/auth/register/        - Register new user
POST   /api/auth/login/           - Login user
POST   /api/auth/logout/          - Logout user
GET    /api/auth/me/              - Get current user info
POST   /api/auth/token/refresh/   - Refresh JWT token
```

### Jobs
```
GET    /api/jobs/                 - List all jobs (with filtering, search, pagination)
POST   /api/jobs/                 - Create new job
GET    /api/jobs/?mine=true       - Get user's own jobs
```

### Profiles
```
GET    /api/profile/<id>/         - Get user profile
PUT    /api/profile/<id>/         - Update profile
GET    /api/profile/freelancers/  - List all freelancers
```

### Projects
```
GET    /api/projects/             - List projects (with filtering, search, pagination)
POST   /api/projects/             - Create new project
GET    /api/projects/<id>/        - Get project details
PUT    /api/projects/<id>/        - Update project
DELETE /api/projects/<id>/        - Delete project
```

### Tasks
```
POST   /api/tasks/                - Create task
GET    /api/tasks/                - List tasks
```

### Meetings
```
GET    /api/meetings/             - List meetings
POST   /api/meetings/             - Create meeting
```

### Messages
```
GET    /api/messages/             - List messages
POST   /api/messages/             - Send message
GET    /api/messages/threads/     - Get message threads
```

### Payments
```
GET    /api/payments/summary/     - Get payment summary
GET    /api/payments/transactions/ - List transactions
```

### Proposals
```
GET    /api/proposals/            - List proposals
POST   /api/proposals/            - Create proposal
GET    /api/proposals/<id>/       - Get proposal details
PUT    /api/proposals/<id>/       - Update proposal
```

### Reviews
```
GET    /api/reviews/              - List reviews
POST   /api/reviews/              - Create review
```

### Support
```
POST   /api/support/              - Submit support request
```

### Dashboard
```
GET    /api/dashboard/summary/    - Get dashboard summary
GET    /api/dashboard/jobs/       - Get dashboard jobs
GET    /api/dashboard/messages/   - Get dashboard messages
```

## 🔍 Query Examples

### Filter Jobs by Type
```
GET /api/jobs/?job_type=freelance&job_type=contract
```

### Search and Filter
```
GET /api/jobs/?search=python&experience_level=intermediate
```

### Pagination
```
GET /api/jobs/?page=2&page_size=10
```

### Sort by Budget (Descending)
```
GET /api/jobs/?ordering=-budget
```

### Get User's Projects with Status
```
GET /api/projects/?status=active&search=website
```

## 🛠️ Validation Rules

### Registration
- Username: 3+ characters, must be unique
- Email: Must be unique and valid
- Password: 8+ characters, must match confirmation
- Role: Must be 'client' or 'freelancer'

### Job Creation
- Title: Required
- Budget: Must be positive number
- Description: Required
- Skills: Comma-separated optional

### Proposal Submission
- Bid Amount: Must be greater than zero
- Cover Letter: Minimum 10 characters

### Review Submission
- Rating: Must be 1-5
- Comment: Minimum 5 characters

### Support Request
- Subject: Minimum 5 characters
- Message: Minimum 10 characters

## 📈 Response Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Delete successful
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## 🚀 Getting Started

### Installation
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Access Points
- API Root: `http://localhost:8000/api/`
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- OpenAPI Schema: `http://localhost:8000/api/schema/`

### Testing with cURL
```bash
# Register
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"testpass123","password_confirm":"testpass123","role":"client"}'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}' \
  -b cookies.txt -c cookies.txt

# Get current user
curl -X GET http://localhost:8000/api/auth/me/ \
  -b cookies.txt
```

## 🎯 Development Notes

- All timestamps in UTC
- Pagination required for large datasets
- Use filtering to improve query performance
- Rate limits reset every hour
- Jobs and Projects have soft-delete support via `is_active` field
- Messages are not automatically marked as read

## 📞 Support

For API issues or questions, contact support through `/api/support/` endpoint.

---

**Version**: 1.0.0  
**Last Updated**: March 2, 2026
