// Admin API Client
const API_BASE = '/api';

class AdminApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  // User Management
  async getUsers(params?: { search?: string; page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' }): Promise<UsersResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.sort) query.set('sort', params.sort);
    if (params?.order) query.set('order', params.order);

    const response = await fetch(`${API_BASE}/admin/users?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<UsersResponse>(response);
  }

  async updateUserBalance(userId: string, data: { amount: number; reason: string }): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/admin/user/balance`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ userId, ...data }),
    });
    return this.handleResponse(response);
  }

  async updateUserStatus(userId: string, status: 'active' | 'frozen'): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/admin/user/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ userId, status }),
    });
    return this.handleResponse(response);
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/admin/user/password`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ userId, newPassword }),
    });
    return this.handleResponse(response);
  }

  async getUserPendingTrades(userId: string): Promise<PendingTrade[]> {
    const response = await fetch(`${API_BASE}/admin/user/${userId}/pending-trades`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<PendingTrade[]>(response);
  }

  async setTradeOutcome(tradeId: string, outcome: 'win' | 'loss'): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/admin/trade/outcome`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ tradeId, outcome }),
    });
    return this.handleResponse(response);
  }

  // Applications
  async getApplications(type?: string): Promise<Application[]> {
    const query = type ? `?type=${type}` : '';
    const response = await fetch(`${API_BASE}/admin/applications${query}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<Application[]>(response);
  }

  async approveApplication(applicationId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/admin/application/approve`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ applicationId }),
    });
    return this.handleResponse(response);
  }

  async rejectApplication(applicationId: string, reason?: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/admin/application/reject`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ applicationId, reason }),
    });
    return this.handleResponse(response);
  }

  async batchApproveApplications(applicationIds: string[]): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/admin/applications/batch-approve`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ applicationIds }),
    });
    return this.handleResponse(response);
  }

  async batchRejectApplications(applicationIds: string[], reason?: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/admin/applications/batch-reject`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ applicationIds, reason }),
    });
    return this.handleResponse(response);
  }

  // Transactions
  async getTransactions(params?: { userId?: string; page?: number; limit?: number }): Promise<TransactionsResponse> {
    const query = new URLSearchParams();
    if (params?.userId) query.set('userId', params.userId);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const response = await fetch(`${API_BASE}/admin/transactions?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<TransactionsResponse>(response);
  }

  // Config
  async getConfig(): Promise<AdminConfig> {
    const response = await fetch(`${API_BASE}/admin/config`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse<AdminConfig>(response);
  }

  async updateRechargeAddress(network: string, address: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/admin/config/recharge-address`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ network, address }),
    });
    return this.handleResponse(response);
  }
}

export const adminApi = new AdminApiClient();

// Types
export interface AdminUser {
  id: string;
  username: string;
  walletAddress?: string;
  balance: number;
  loanAmount: number;
  totalWins: number;
  totalLosses: number;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'none';
  status: 'active' | 'frozen';
  createdAt: string;
}

export interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PendingTrade {
  id: string;
  pair: string;
  side: 'long' | 'short';
  amount: number;
  duration: number;
  entryPrice: number;
  profitRate: number;
  startTime: number;
  endTime: number;
}

export interface Application {
  id: string;
  userId: string;
  username: string;
  type: 'loan' | 'repayment' | 'verify' | 'recharge' | 'withdraw';
  amount?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  details?: Record<string, unknown>;
}

export interface Transaction {
  id: string;
  userId: string;
  username: string;
  type: 'trade' | 'loan' | 'repayment' | 'recharge' | 'withdraw';
  amount: number;
  result?: 'win' | 'loss';
  profit?: number;
  createdAt: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminConfig {
  rechargeAddresses: {
    network: string;
    address: string;
  }[];
}
