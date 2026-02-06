export type UserRole = 'admin' | 'agent' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash?: string;
  created_at: Date;
}

export interface UserRole_DB {
  id: string;
  user_id: string;
  role: UserRole;
  insurance_provider_id?: string;
}

export interface UserWithRole extends User {
  role: UserRole;
  insurance_provider_id?: string;
}

export interface InsuranceProvider {
  id: string;
  name: string;
  logo: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
}

export interface Section {
  id: string;
  insurance_provider_id: string;
  title: string;
  description?: string;
  order: number;
  is_active: boolean;
  created_at: Date;
}

export interface Question {
  id: string;
  section_id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: any;
  order: number;
  created_at: Date;
}

export interface FormResponse {
  id: string;
  user_id: string;
  section_id: string;
  insurance_provider_id: string;
  responses: any;
  status: 'DRAFT' | 'SUBMITTED';
  is_submitted: boolean;
  submitted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface JWTPayload {
  userId: string;
  role: UserRole;
  insuranceProviderId?: string;
}

export interface BulkUploadResult {
  total_rows: number;
  inserted_rows: number;
  failed_rows: number;
  error_details: { row: number; error: string }[];
  questions?: Question[];
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      file?: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        buffer: Buffer;
        size: number;
      };
    }
  }
}
