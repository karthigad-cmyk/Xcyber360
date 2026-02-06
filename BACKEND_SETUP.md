# XCyber Backend Setup Guide

This guide will help you set up and run the backend server for the XCyber Insurance Portal.

## Quick Setup (5 minutes)

### Step 1: Install PostgreSQL
Make sure PostgreSQL is installed and running on your system.

### Step 2: Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE xcyber;

# Exit
\q
```

### Step 3: Configure Backend
```bash
# Navigate to backend folder
cd backend

# Copy environment file
cp .env.example .env

# Edit .env file with your database credentials
# DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/xcyber
```

### Step 4: Run Database Schema
```bash
# Run the schema file
psql -U postgres -d xcyber -f database/schema.sql
```

### Step 5: Install Dependencies & Run
```bash
# Install packages
npm install

# Start development server
npm run dev
```

The server will start at `http://localhost:3001`

---

## Test Credentials

After setup, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@xcyber.com | Admin@123 |
| Agent | agent@xcyber.com | Agent@123 |

**Note:** These are test accounts. For production, create new accounts through the registration page.

---

## API Endpoints Reference

### Health Check
```
GET http://localhost:3001/api/health
```

### Authentication
```
POST /api/auth/register   - Register new user
POST /api/auth/login      - Login
GET  /api/auth/profile    - Get current user (requires auth)
```

### Banks (Insurance Companies)
```
GET    /api/banks         - List all insurance companies
GET    /api/banks/:id     - Get single company
POST   /api/banks         - Create company (admin only)
PUT    /api/banks/:id     - Update company (admin only)
DELETE /api/banks/:id     - Delete company (admin only)
```

### Sections
```
GET    /api/sections?bankId=  - List sections
GET    /api/sections/:id      - Get section with questions
POST   /api/sections          - Create section (admin only)
PUT    /api/sections/:id      - Update section (admin only)
DELETE /api/sections/:id      - Delete section (admin only)
```

### Questions
```
GET    /api/sections/:id/questions  - Get questions for section
POST   /api/sections/:id/questions  - Create question (admin only)
PUT    /api/questions/:id           - Update question (admin only)
DELETE /api/questions/:id           - Delete question (admin only)
```

### Responses
```
GET  /api/responses                     - List responses (role-filtered)
GET  /api/responses/:id                 - Get single response
GET  /api/responses/user/section/:id    - Get user's section response
POST /api/responses/save                - Save/update response (auto-save)
POST /api/responses/:id/submit          - Submit response
```

### Stats
```
GET /api/stats/admin  - Admin dashboard stats
GET /api/stats/agent  - Agent dashboard stats
```

### Users (Admin Only)
```
GET    /api/users?role=  - List users
GET    /api/users/:id    - Get single user
PUT    /api/users/:id    - Update user
DELETE /api/users/:id    - Delete user
```

---

## Troubleshooting

### 404 Errors
- Make sure the backend server is running on port 3001
- Check the API endpoint URL is correct
- Verify the route exists in the backend

### 500 Errors
- Check if PostgreSQL is running
- Verify DATABASE_URL in .env is correct
- Check backend console for detailed error messages

### CORS Errors
- The backend is configured to allow requests from `http://localhost:5173`
- Update `FRONTEND_URL` in `.env` if your frontend runs on a different port

### Connection Refused
- Make sure both servers are running:
  - Backend: `cd backend && npm run dev` (port 3001)
  - Frontend: `npm run dev` (port 5173)

---

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/xcyber

# JWT
JWT_SECRET=your-secret-key-at-least-64-characters
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173
```

---

## Insurance Companies

The system comes pre-configured with 19 Indian insurance companies:

1. Life Insurance Corporation of India (LIC)
2. HDFC Life Insurance
3. ICICI Prudential Life Insurance
4. SBI Life Insurance
5. Max Life Insurance
6. Bajaj Allianz Life Insurance
7. Kotak Mahindra Life Insurance
8. Aditya Birla Sun Life Insurance
9. Tata AIA Life Insurance
10. PNB MetLife Insurance
11. Canara HSBC Life Insurance
12. Reliance Nippon Life Insurance
13. Exide Life Insurance
14. IndiaFirst Life Insurance
15. Aegon Life Insurance
16. Edelweiss Tokio Life Insurance
17. Aviva Life Insurance
18. Shriram Life Insurance
19. Pramerica Life Insurance

These are seeded automatically when you run the schema.sql file.
