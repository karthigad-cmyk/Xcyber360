# XCyber Backend Server

Complete Node.js/Express backend for the XCyber Insurance Portal.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

**Required Environment Variables:**
```env
PORT=3001
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/xcyber
JWT_SECRET=your-super-secret-key-at-least-64-characters-long
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### 3. Setup Database

```bash
# Create database
psql -U postgres -c "CREATE DATABASE xcyber;"

# Run schema (includes insurance companies and sample data)
psql -U postgres -d xcyber -f database/schema.sql

# Optional: Seed test users with proper password hashes
npx ts-node database/seed-users.ts
```

### 4. Start Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

Server runs on: `http://localhost:3001`
API Base: `http://localhost:3001/api`
Health Check: `http://localhost:3001/api/health`

---

## 📋 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/profile` | Get current user | Yes |

### Banks (Admin Only for Create/Update/Delete)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/banks` | List all banks | Yes |
| GET | `/api/banks/:id` | Get single bank | Yes |
| POST | `/api/banks` | Create bank | Admin |
| PUT | `/api/banks/:id` | Update bank | Admin |
| DELETE | `/api/banks/:id` | Delete bank | Admin |

### Sections (Admin Only for Create/Update/Delete)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/sections?bankId=` | List sections | Yes |
| GET | `/api/sections/:id` | Get section with questions | Yes |
| POST | `/api/sections` | Create section | Admin |
| PUT | `/api/sections/:id` | Update section | Admin |
| DELETE | `/api/sections/:id` | Delete section | Admin |
| GET | `/api/sections/:id/questions` | Get questions | Yes |
| POST | `/api/sections/:id/questions` | Create question | Admin |
| PUT | `/api/sections/:id/questions/reorder` | Reorder questions | Admin |

### Questions (Admin Only)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| PUT | `/api/questions/:id` | Update question | Admin |
| DELETE | `/api/questions/:id` | Delete question | Admin |

### Responses
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/responses` | List responses (role-filtered) | Yes |
| GET | `/api/responses/:id` | Get single response | Yes |
| GET | `/api/responses/user/section/:sectionId` | Get user's section response | Yes |
| POST | `/api/responses/save` | Save/update response (auto-save) | Yes |
| POST | `/api/responses/:id/submit` | Submit response | Yes |

### Stats
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/stats/admin` | Admin dashboard stats | Admin |
| GET | `/api/stats/agent` | Agent dashboard stats | Agent |

### Users (Admin Only)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users?role=` | List users | Admin |
| GET | `/api/users/:id` | Get single user | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |

---

## 🔐 Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Login Request Example
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@xcyber.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "System Admin",
      "email": "admin@xcyber.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 👥 Test Credentials

After running the schema and seed-users script:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@xcyber.com | Admin@123 |
| Agent | agent@xcyber.com | Agent@123 (HDFC Life) |

**Note:** Register new users through the application for proper security.

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts      # PostgreSQL connection
│   ├── middleware/
│   │   └── auth.ts          # JWT authentication
│   ├── routes/
│   │   ├── auth.ts          # Auth endpoints
│   │   ├── banks.ts         # Bank CRUD
│   │   ├── sections.ts      # Section & question mgmt
│   │   ├── questions.ts     # Question updates
│   │   ├── responses.ts     # Form responses
│   │   ├── stats.ts         # Dashboard stats
│   │   └── users.ts         # User management
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   └── index.ts             # Express app entry
├── database/
│   └── schema.sql           # Full database schema
├── .env.example             # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔗 Frontend Connection

Update your frontend to connect to this backend:

**Option 1: Environment Variable**
```bash
# In your frontend .env or environment
VITE_API_URL=http://localhost:3001/api
```

**Option 2: Direct Update**
```typescript
// src/services/api.ts
const API_BASE_URL = 'http://localhost:3001/api';
```

---

## 🚀 Production Deployment

### Using PM2
```bash
npm run build
pm2 start dist/index.js --name xcyber-api
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@db-host:5432/xcyber?ssl=true
JWT_SECRET=<generate-a-secure-64-char-string>
FRONTEND_URL=https://your-frontend-domain.com
```

---

## ❓ Troubleshooting

### Database Connection Failed
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify DATABASE_URL format
- Ensure database exists: `psql -U postgres -c "\l"`

### JWT Errors
- Ensure JWT_SECRET is set in .env
- Token format: `Bearer <token>` (with space)

### CORS Issues
- Update FRONTEND_URL in .env to match your frontend origin
- For multiple origins, modify cors config in src/index.ts
