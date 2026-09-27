import { UserRole, PermissionSet, User } from '../types';
import { getEffectivePermissions, RBAC_ROLE_DEFINITIONS, RoleDefinition } from '../utils/rbac';
import { parseApiResponse } from '../utils/apiClient';

export interface AuthState {
  user: User | null;
  token: string | null;
  permissions: PermissionSet | null;
  roleDefinition: RoleDefinition | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const TOKEN_KEY = 'mfg_erp_jwt_token';
const USER_KEY = 'mfg_erp_auth_user';

export const authService = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setAuth(token: string, user: User) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to store auth tokens:', e);
    }
  },

  clearAuth() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('mfg_inv_odoo_v2_user');
      localStorage.removeItem('auth_token');
    } catch (e) {
      console.warn('Failed to clear auth storage:', e);
    }
  },

  getStoredUser(): User | null {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async login(emailOrUsername: string, password: string): Promise<{ user: User; token: string; permissions: PermissionSet }> {
    let lastError: any;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrUsername, password }),
        });

        const data = await parseApiResponse<{ user: User; token: string; permissions: PermissionSet }>(res);
        this.setAuth(data.token, data.user);
        return data;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        if (msg.includes('no available server') || msg.includes('502') || msg.includes('503') || msg.includes('Failed to fetch')) {
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
            continue;
          }
        }
        throw err;
      }
    }
    throw lastError;
  },

  async register(payload: { username: string; email: string; fullName: string; password: string; role: UserRole; department?: string }): Promise<{ user: User; token: string; permissions: PermissionSet }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await parseApiResponse<{ user: User; token: string; permissions: PermissionSet }>(res);
    this.setAuth(data.token, data.user);
    return data;
  },

  async fetchCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getAuthHeaders(),
      });
      if (res.status === 401 || res.status === 403) {
        this.clearAuth();
        return null;
      }
      const data = await parseApiResponse<{ user: User }>(res);
      return data.user;
    } catch {
      return this.getStoredUser();
    }
  },

  async syncFullStateToBackend(state: Record<string, any>): Promise<{ success: boolean; isPostgresConnected: boolean }> {
    try {
      const res = await fetch('/api/data/sync-full', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(state),
      });
      const data = await parseApiResponse<{ success: boolean; isPostgresConnected: boolean }>(res);
      return { success: !!data.success, isPostgresConnected: !!data.isPostgresConnected };
    } catch {
      return { success: false, isPostgresConnected: false };
    }
  },

  async checkBackendStatus(): Promise<{ connected: boolean; status: string; postgres: boolean }> {
    try {
      const res = await fetch('/api/status');
      const data = await parseApiResponse<any>(res);
      return {
        connected: true,
        status: data.status,
        postgres: !!data.database?.connected
      };
    } catch {
      return { connected: false, status: 'offline', postgres: false };
    }
  }
};
