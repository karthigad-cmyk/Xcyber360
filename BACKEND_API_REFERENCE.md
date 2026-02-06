# XCYPER Backend API Reference

**Base URL:** `http://localhost:3001/api`

## Authentication

All endpoints (except auth endpoints) require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "Password123",
  "role": "user|agent|admin",
  "insuranceProviderId": "hdfc-life" // Required for agents, optional for users
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "user",
      "insuranceProviderId": "hdfc-life",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123",
  "role": "user|agent|admin"
}
```

### GET /auth/profile
Get current user profile.

---

## Insurance Provider Endpoints

### GET /providers
List all insurance providers.

### GET /providers/:id
Get a single provider by ID.

### POST /providers (Admin only)
Create a new provider.

**Request Body:**
```json
{
  "id": "new-provider",
  "name": "New Provider Name",
  "logo": "https://example.com/logo.png",
  "description": "Description",
  "isActive": true
}
```

### PUT /providers/:id (Admin only)
Update a provider.

### DELETE /providers/:id (Admin only)
Delete a provider.

---

## Section Endpoints

### GET /sections
List sections (optionally filtered by provider).

**Query Parameters:**
- `insuranceProviderId` - Filter by provider ID

### GET /sections/:id
Get a single section with questions.

### POST /sections (Admin only)
Create a new section.

**Request Body:**
```json
{
  "insuranceProviderId": "hdfc-life",
  "title": "Personal Information",
  "description": "Basic personal details",
  "order": 1,
  "isActive": true
}
```

### PUT /sections/:id (Admin only)
Update a section.

### DELETE /sections/:id (Admin only)
Delete a section.

### GET /sections/:id/questions
Get all questions for a section.

### POST /sections/:id/questions (Admin only)
Create a question in a section.

**Request Body:**
```json
{
  "type": "text|textarea|mcq|checkbox|dropdown|number|date|email|phone",
  "label": "What is your name?",
  "placeholder": "Enter your name",
  "required": true,
  "options": [
    { "id": "1", "label": "Option 1", "value": "option_1" }
  ],
  "order": 1
}
```

### PUT /sections/:id/questions/reorder (Admin only)
Reorder questions.

---

## Question Endpoints

### GET /questions (Admin only)
List all questions.

**Query Parameters:**
- `sectionId` - Filter by section

### PUT /questions/:id (Admin only)
Update a question.

### DELETE /questions/:id (Admin only)
Delete a question.

### POST /questions/bulk-upload (Admin only)
Bulk upload questions from CSV/Excel.

**Form Data:**
- `file` - CSV or Excel file
- `sectionId` - Target section ID
- `insuranceProviderId` - Provider ID

### GET /questions/template/csv (Admin only)
Download CSV template.

### GET /questions/template/excel (Admin only)
Download Excel template.

---

## Response Endpoints

### GET /responses
List form responses.

**Query Parameters:**
- `insuranceProviderId` - Filter by provider
- `sectionId` - Filter by section
- `userId` - Filter by user (admin only)
- `isSubmitted` - true/false
- `status` - DRAFT|SUBMITTED

**Role-based Access:**
- Admin: Can see all responses
- Agent: Can only see responses for their assigned provider
- User: Can only see their own responses

### GET /responses/:id
Get a single response.

### GET /responses/user/section/:sectionId
Get current user's response for a section.

### POST /responses/save
Save or update a response (auto-save/draft).

**Request Body:**
```json
{
  "sectionId": "section-uuid",
  "insuranceProviderId": "hdfc-life",
  "responses": [
    { "questionId": "question-uuid", "value": "Answer" },
    { "questionId": "question-uuid-2", "value": ["option1", "option2"] }
  ]
}
```

### POST /responses/:id/submit
Submit a response (locks editing).

---

## Stats Endpoints

### GET /stats/admin (Admin only)
Get admin dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 100,
    "totalAgents": 10,
    "totalProviders": 19,
    "totalResponses": 500,
    "submittedResponses": 300,
    "pendingResponses": 200
  }
}
```

### GET /stats/agent (Agent only)
Get agent dashboard statistics (scoped to their provider).

---

## User Endpoints (Admin only)

### GET /users
List all users.

**Query Parameters:**
- `role` - Filter by role (user|agent|admin)

### GET /users/:id
Get a single user.

### PUT /users/:id
Update a user.

### DELETE /users/:id
Delete a user.

---

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

**Status Codes:**
- 400 - Bad Request (validation error)
- 401 - Unauthorized (missing/invalid token)
- 403 - Forbidden (insufficient permissions)
- 404 - Not Found
- 500 - Internal Server Error

---

## Testing with Postman

1. **Set up environment variables:**
   - `base_url`: `http://localhost:3001/api`
   - `token`: (will be set after login)

2. **Login first:**
   ```
   POST {{base_url}}/auth/login
   Body: {"email": "admin@xcyber.com", "password": "Admin@123", "role": "admin"}
   ```

3. **Use the token:**
   Add header: `Authorization: Bearer {{token}}`

4. **Test endpoints!**
