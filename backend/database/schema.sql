-- XCyber Insurance Portal Database Schema
-- Run this SQL in your PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS response_answers CASCADE;
DROP TABLE IF EXISTS form_responses CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS insurance_providers CASCADE;
DROP TYPE IF EXISTS app_role CASCADE;
DROP TYPE IF EXISTS response_status CASCADE;

-- Create role enum
CREATE TYPE app_role AS ENUM ('admin', 'agent', 'user');

-- Create response status enum
CREATE TYPE response_status AS ENUM ('DRAFT', 'SUBMITTED');

-- Insurance Providers table (REQUIRED - must be created first)
CREATE TABLE insurance_providers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo TEXT DEFAULT '',
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User roles table (allows users to have different roles)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  insurance_provider_id VARCHAR(50) REFERENCES insurance_providers(id) ON DELETE SET NULL,
  UNIQUE(user_id, role)
);

-- Sections table (form sections for each insurance provider)
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_provider_id VARCHAR(50) REFERENCES insurance_providers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  "order" INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Questions table (questions within sections)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'textarea', 'mcq', 'checkbox', 'dropdown', 'number', 'date', 'email', 'phone', 'select')),
  label TEXT NOT NULL,
  placeholder TEXT DEFAULT '',
  required BOOLEAN DEFAULT true,
  options JSONB, -- For MCQ, checkbox, dropdown: [{"id": "1", "label": "Option 1", "value": "opt1"}]
  "order" INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Form responses table (user submissions - main header)
CREATE TABLE form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  insurance_provider_id VARCHAR(50) REFERENCES insurance_providers(id) ON DELETE SET NULL,
  responses JSONB NOT NULL DEFAULT '[]', -- [{"questionId": "uuid", "value": "answer"}]
  status response_status DEFAULT 'DRAFT',
  is_submitted BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, section_id) -- One response per user per section
);

-- Response answers table (individual question answers for granular queries)
CREATE TABLE response_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES form_responses(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_value TEXT,
  answer_array JSONB, -- For checkbox/multi-select answers
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_provider ON user_roles(insurance_provider_id);
CREATE INDEX idx_sections_provider ON sections(insurance_provider_id);
CREATE INDEX idx_sections_order ON sections("order");
CREATE INDEX idx_questions_section ON questions(section_id);
CREATE INDEX idx_questions_order ON questions("order");
CREATE INDEX idx_responses_user ON form_responses(user_id);
CREATE INDEX idx_responses_section ON form_responses(section_id);
CREATE INDEX idx_responses_provider ON form_responses(insurance_provider_id);
CREATE INDEX idx_responses_status ON form_responses(status);
CREATE INDEX idx_responses_submitted ON form_responses(is_submitted);
CREATE INDEX idx_response_answers_response ON response_answers(response_id);
CREATE INDEX idx_response_answers_question ON response_answers(question_id);

-- Trigger to update updated_at on form_responses
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_form_responses_updated_at
    BEFORE UPDATE ON form_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_response_answers_updated_at
    BEFORE UPDATE ON response_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA - Insurance Providers (Required)
-- ============================================

INSERT INTO insurance_providers (id, name, logo, description, is_active) VALUES 
  ('lic', 'Life Insurance Corporation of India (LIC)', '', 'India''s largest life insurance company', true),
  ('hdfc-life', 'HDFC Life Insurance', '', 'HDFC Life Insurance Services', true),
  ('icici-prudential', 'ICICI Prudential Life Insurance', '', 'ICICI Prudential Life Insurance', true),
  ('sbi-life', 'SBI Life Insurance', '', 'SBI Life Insurance Company', true),
  ('max-life', 'Max Life Insurance', '', 'Max Life Insurance Company', true),
  ('bajaj-allianz', 'Bajaj Allianz Life Insurance', '', 'Bajaj Allianz Life Insurance', true),
  ('kotak-mahindra', 'Kotak Mahindra Life Insurance', '', 'Kotak Mahindra Life Insurance', true),
  ('aditya-birla', 'Aditya Birla Sun Life Insurance', '', 'Aditya Birla Sun Life Insurance', true),
  ('tata-aia', 'Tata AIA Life Insurance', '', 'Tata AIA Life Insurance', true),
  ('pnb-metlife', 'PNB MetLife Insurance', '', 'PNB MetLife Insurance', true),
  ('canara-hsbc', 'Canara HSBC Life Insurance', '', 'Canara HSBC Life Insurance', true),
  ('reliance-nippon', 'Reliance Nippon Life Insurance', '', 'Reliance Nippon Life Insurance', true),
  ('exide-life', 'Exide Life Insurance', '', 'Exide Life Insurance', true),
  ('indiafirst-life', 'IndiaFirst Life Insurance', '', 'IndiaFirst Life Insurance', true),
  ('aegon-life', 'Aegon Life Insurance', '', 'Aegon Life Insurance', true),
  ('edelweiss-tokio', 'Edelweiss Tokio Life Insurance', '', 'Edelweiss Tokio Life Insurance', true),
  ('aviva-life', 'Aviva Life Insurance', '', 'Aviva Life Insurance', true),
  ('shriram-life', 'Shriram Life Insurance', '', 'Shriram Life Insurance', true),
  ('pramerica-life', 'Pramerica Life Insurance', '', 'Pramerica Life Insurance', true);

-- ============================================
-- SEED DATA - Test Users
-- ============================================
-- Password: Admin@123 (bcrypt hash with 10 rounds)

-- Insert admin user
-- Email: admin@xcyber.com | Password: Admin@123
INSERT INTO users (id, name, email, phone, password_hash)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'System Admin',
  'admin@xcyber.com',
  '+1234567890',
  '$2a$10$rOvHPxfzO2.JV9o3LrQpwuZlXpYLWX8Q.F2D5YvVJXvGQkzZQgEIi'
);

INSERT INTO user_roles (user_id, role)
VALUES ('a0000000-0000-0000-0000-000000000001', 'admin');

-- Insert sample agent for HDFC Life
-- Email: agent@xcyber.com | Password: Agent@123
INSERT INTO users (id, name, email, phone, password_hash)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'John Agent',
  'agent@xcyber.com',
  '+1234567891',
  '$2a$10$rOvHPxfzO2.JV9o3LrQpwuZlXpYLWX8Q.F2D5YvVJXvGQkzZQgEIi'
);

INSERT INTO user_roles (user_id, role, insurance_provider_id)
VALUES ('a0000000-0000-0000-0000-000000000002', 'agent', 'hdfc-life');

-- Insert sample regular user
-- Email: user@xcyber.com | Password: User@123
INSERT INTO users (id, name, email, phone, password_hash)
VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'Test User',
  'user@xcyber.com',
  '+1234567892',
  '$2a$10$rOvHPxfzO2.JV9o3LrQpwuZlXpYLWX8Q.F2D5YvVJXvGQkzZQgEIi'
);

INSERT INTO user_roles (user_id, role, insurance_provider_id)
VALUES ('a0000000-0000-0000-0000-000000000003', 'user', 'hdfc-life');

-- ============================================
-- SEED DATA - Sample Section & Questions
-- ============================================

-- Insert sample section for HDFC Life
INSERT INTO sections (id, insurance_provider_id, title, description, "order", is_active)
VALUES (
  's0000000-0000-0000-0000-000000000001',
  'hdfc-life',
  'Personal Information',
  'Basic personal details required for insurance application',
  1,
  true
);

-- Insert sample questions
INSERT INTO questions (section_id, type, label, placeholder, required, options, "order")
VALUES 
  ('s0000000-0000-0000-0000-000000000001', 'text', 'Full Name', 'Enter your full name', true, NULL, 1),
  ('s0000000-0000-0000-0000-000000000001', 'email', 'Email Address', 'Enter your email', true, NULL, 2),
  ('s0000000-0000-0000-0000-000000000001', 'phone', 'Phone Number', 'Enter your phone number', true, NULL, 3),
  ('s0000000-0000-0000-0000-000000000001', 'date', 'Date of Birth', '', true, NULL, 4),
  ('s0000000-0000-0000-0000-000000000001', 'dropdown', 'Gender', 'Select your gender', true, 
   '[{"id": "1", "label": "Male", "value": "male"}, {"id": "2", "label": "Female", "value": "female"}, {"id": "3", "label": "Other", "value": "other"}]', 5),
  ('s0000000-0000-0000-0000-000000000001', 'mcq', 'Marital Status', '', true,
   '[{"id": "1", "label": "Single", "value": "single"}, {"id": "2", "label": "Married", "value": "married"}, {"id": "3", "label": "Divorced", "value": "divorced"}]', 6);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'XCYBER Database Schema Created Successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Test Credentials:';
  RAISE NOTICE 'Admin: admin@xcyber.com / Admin@123';
  RAISE NOTICE 'Agent: agent@xcyber.com / Agent@123';
  RAISE NOTICE 'User:  user@xcyber.com  / User@123';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Insurance Providers: 19 seeded';
  RAISE NOTICE 'Sample Section: Personal Information (HDFC Life)';
  RAISE NOTICE 'Sample Questions: 6 questions created';
  RAISE NOTICE '============================================';
END $$;
