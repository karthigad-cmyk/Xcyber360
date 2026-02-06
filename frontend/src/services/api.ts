import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  InsuranceProvider,
  Section,
  Question,
  FormResponse,
  AdminStats,
  AgentStats,
  BulkUploadResult,
} from '@/types';

// Configure your backend URL here
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('xcyper_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          return {
            success: false,
            error: `Server error: ${response.status} ${response.statusText}`,
          };
        }
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `Request failed with status ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return {
          success: false,
          error: 'Cannot connect to server. Make sure the backend is running on ' + API_BASE_URL,
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('xcyper_token', token);
    } else {
      localStorage.removeItem('xcyper_token');
    }
  }

  getToken() {
    return this.token;
  }

  private getBaseUrl(): string {
    return API_BASE_URL;
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (response.success && response.data) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.success && response.data) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async logout(): Promise<void> {
    this.setToken(null);
    localStorage.removeItem('xcyper_user');
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/profile');
  }

  // Insurance Provider endpoints
  async getProviders(): Promise<ApiResponse<InsuranceProvider[]>> {
    return this.request<InsuranceProvider[]>('/providers');
  }

  async getProvider(id: string): Promise<ApiResponse<InsuranceProvider>> {
    return this.request<InsuranceProvider>(`/providers/${id}`);
  }

  async createProvider(data: Partial<InsuranceProvider>): Promise<ApiResponse<InsuranceProvider>> {
    return this.request<InsuranceProvider>('/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProvider(id: string, data: Partial<InsuranceProvider>): Promise<ApiResponse<InsuranceProvider>> {
    return this.request<InsuranceProvider>(`/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProvider(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/providers/${id}`, {
      method: 'DELETE',
    });
  }

  // Section endpoints
  async getSections(insuranceProviderId?: string): Promise<ApiResponse<Section[]>> {
    const query = insuranceProviderId ? `?insuranceProviderId=${insuranceProviderId}` : '';
    return this.request<Section[]>(`/sections${query}`);
  }

  async getSection(id: string): Promise<ApiResponse<Section>> {
    return this.request<Section>(`/sections/${id}`);
  }

  async createSection(data: Partial<Section>): Promise<ApiResponse<Section>> {
    return this.request<Section>('/sections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSection(id: string, data: Partial<Section>): Promise<ApiResponse<Section>> {
    return this.request<Section>(`/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSection(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/sections/${id}`, {
      method: 'DELETE',
    });
  }

  // Question endpoints
  async getQuestions(sectionId: string): Promise<ApiResponse<Question[]>> {
    return this.request<Question[]>(`/sections/${sectionId}/questions`);
  }

  async createQuestion(sectionId: string, data: Partial<Question>): Promise<ApiResponse<Question>> {
    return this.request<Question>(`/sections/${sectionId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuestion(id: string, data: Partial<Question>): Promise<ApiResponse<Question>> {
    return this.request<Question>(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuestion(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/questions/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderQuestions(sectionId: string, questionIds: string[]): Promise<ApiResponse<void>> {
    return this.request<void>(`/sections/${sectionId}/questions/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ questionIds }),
    });
  }

  // Bulk upload questions
  async bulkUploadQuestions(formData: FormData): Promise<ApiResponse<BulkUploadResult>> {
    const url = `${this.getBaseUrl()}/questions/bulk-upload`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Upload failed',
        };
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Download question template
  async downloadQuestionTemplate(type: 'csv' | 'excel'): Promise<ApiResponse<Blob>> {
    const endpoint = type === 'csv' ? '/questions/template/csv' : '/questions/template/excel';
    const url = `${this.getBaseUrl()}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to download template',
        };
      }

      const blob = await response.blob();
      return {
        success: true,
        data: blob,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Response endpoints
  async getResponses(filters?: {
    insuranceProviderId?: string;
    sectionId?: string;
    userId?: string;
    isSubmitted?: boolean;
    status?: 'DRAFT' | 'SUBMITTED';
  }): Promise<ApiResponse<FormResponse[]>> {
    const params = new URLSearchParams();
    if (filters?.insuranceProviderId) params.append('insuranceProviderId', filters.insuranceProviderId);
    if (filters?.sectionId) params.append('sectionId', filters.sectionId);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.isSubmitted !== undefined) params.append('isSubmitted', String(filters.isSubmitted));
    if (filters?.status) params.append('status', filters.status);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<FormResponse[]>(`/responses${query}`);
  }

  async getResponse(id: string): Promise<ApiResponse<FormResponse>> {
    return this.request<FormResponse>(`/responses/${id}`);
  }

  async getUserResponse(sectionId: string): Promise<ApiResponse<FormResponse | null>> {
    return this.request<FormResponse | null>(`/responses/user/section/${sectionId}`);
  }

  async saveResponse(data: {
    sectionId: string;
    insuranceProviderId: string;
    responses: { questionId: string; value: string | string[] }[];
  }): Promise<ApiResponse<FormResponse>> {
    return this.request<FormResponse>('/responses/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitResponse(id: string): Promise<ApiResponse<FormResponse>> {
    return this.request<FormResponse>(`/responses/${id}/submit`, {
      method: 'POST',
    });
  }

  // Stats endpoints
  async getAdminStats(): Promise<ApiResponse<AdminStats>> {
    return this.request<AdminStats>('/stats/admin');
  }

  async getAgentStats(): Promise<ApiResponse<AgentStats>> {
    return this.request<AgentStats>('/stats/agent');
  }

  // User management (admin only)
  async getUsers(role?: string): Promise<ApiResponse<User[]>> {
    const query = role ? `?role=${role}` : '';
    return this.request<User[]>(`/users${query}`);
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`);
  }

  async updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
export default api;
