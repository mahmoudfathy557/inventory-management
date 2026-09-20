import { UserRole, PermissionSet, User } from '../types';
import { getEffectivePermissions, RBAC_ROLE_DEFINITIONS, RoleDefinition } from '../utils/rbac';

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
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed.');
    }

    this.setAuth(data.token, data.user);
    return data;
  },

  async register(payload: { username: string; email: string; fullName: string; password: string; role: UserRole; department?: string }): Promise<{ user: User; token: string; permissions: PermissionSet }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

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
      if (!res.ok) {
        this.clearAuth();
        return null;
      }
      const data = await res.json();
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
      const data = await res.json();
      return { success: !!data.success, isPostgresConnected: !!data.isPostgresConnected };
    } catch {
      return { success: false, isPostgresConnected: false };
    }
  },

  async checkBackendStatus(): Promise<{ connected: boolean; status: string; postgres: boolean }> {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) return { connected: false, status: 'offline', postgres: false };
      const data = await res.json();
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
