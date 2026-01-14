// API Client with token handling and error management
const API_BASE = '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401 || response.status === 403) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/auth';
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP error ${response.status}`);
    }
    
    return response.json();
  }

  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(includeAuth),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown, includeAuth: boolean = true): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(includeAuth),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  // Set token after login
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // Clear token on logout
  clearToken(): void {
    localStorage.removeItem('token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const api = new ApiClient();

// API Types
export interface PriceData {
  id: string;
  symbol: string;
  usd: number;
  usd_24h_change: number;
}

export interface WalletConnectResponse {
  token: string;
  user: {
    id: string;
    walletAddress: string;
  };
}

export interface SmartTradeRequest {
  pair: string;
  side: 'long' | 'short';
  amount: number;
  duration: number;
}

export interface SmartTradeResponse {
  id: string;
  pair: string;
  side: 'long' | 'short';
  amount: number;
  duration: number;
  entryPrice: number;
  profitRate: number;
  fee: number;
  startTime: number;
}

export interface WalletAsset {
  symbol: string;
  name: string;
  balance: number;
  icon: string;
}

export interface WalletResponse {
  assets: WalletAsset[];
}

export interface LoanApplicationRequest {
  amount: number;
}

export interface RepaymentRequest {
  amount: number;
  loanId?: string;
  receiptImage?: string;
}

export interface VerifyRequest {
  fullName: string;
  idNumber: string;
  idType: 'passport' | 'driver_license' | 'national_id' | 'other';
  idImage: string | null;
}

export interface RechargeRequest {
  amount: number;
  network?: string;
  receiptImage?: string;
}

export interface WithdrawRequest {
  amount: number;
  address?: string;
  network?: string;
}

export interface ApplicationResponse {
  success: boolean;
  message?: string;
  id?: string;
}
