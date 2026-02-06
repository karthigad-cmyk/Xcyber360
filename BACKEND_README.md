# XCyber Backend - Node.js + Express + PostgreSQL

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 2. Create the database
```sql
CREATE DATABASE xcyber;
```

### 3. Run the schema
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User roles table
CREATE TYPE app_role AS ENUM ('admin', 'agent', 'user');
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  bank_id UUID,
  UNIQUE(user_id, role)
);

-- Banks table  
CREATE TABLE banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logo TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sections table
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID REFERENCES banks(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "order" INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  label TEXT NOT NULL,
  placeholder TEXT,
  required BOOLEAN DEFAULT true,
  options JSONB,
  "order" INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Form responses table
CREATE TABLE form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  bank_id UUID REFERENCES banks(id),
  responses JSONB NOT NULL DEFAULT '[]',
  is_submitted BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_sections_bank ON sections(bank_id);
CREATE INDEX idx_questions_section ON questions(section_id);
CREATE INDEX idx_responses_user ON form_responses(user_id);
CREATE INDEX idx_responses_section ON form_responses(section_id);
CREATE INDEX idx_responses_bank ON form_responses(bank_id);
```

### 4. Environment Variables (.env)
```
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/xcyber
JWT_SECRET=your-super-secret-key-change-in-production
```

### 5. Install & Run
```bash
npm install express pg bcryptjs jsonwebtoken cors dotenv
npm install -D typescript @types/express @types/node @types/bcryptjs @types/jsonwebtoken @types/cors
npx tsc --init
npm run dev
```

## API Endpoints

### Auth
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login
- GET /api/auth/profile - Get current user

### Banks (Admin)
- GET /api/banks - List all banks
- POST /api/banks - Create bank
- PUT /api/banks/:id - Update bank
- DELETE /api/banks/:id - Delete bank

### Sections (Admin)
- GET /api/sections?bankId= - List sections
- POST /api/sections - Create section
- PUT /api/sections/:id - Update section
- DELETE /api/sections/:id - Delete section

### Questions (Admin)
- GET /api/sections/:id/questions - List questions
- POST /api/sections/:id/questions - Create question
- PUT /api/questions/:id - Update question
- DELETE /api/questions/:id - Delete question

### Responses
- GET /api/responses - List responses (filtered by role)
- POST /api/responses/save - Save/update response (auto-save)
- POST /api/responses/:id/submit - Submit response

### Stats
- GET /api/stats/admin - Admin dashboard stats
- GET /api/stats/agent - Agent dashboard stats

## Frontend Connection

Update your frontend API URL in `src/services/api.ts`:
```typescript
const API_BASE_URL = 'http://localhost:3001/api';
```

Or set environment variable:
```
VITE_API_URL=http://localhost:3001/api
```
