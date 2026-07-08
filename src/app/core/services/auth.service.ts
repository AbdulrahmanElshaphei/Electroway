import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { decodeJwt, isJwtExpired } from '../utils/jwt.util';

export type UserRole = 'driver' | 'owner' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  /** Derived from the email's local part since /login doesn't return a name. */
  name: string;
  initials: string;
  verificationStatus?: string | null;
  reviewNotes?: string | null;
}

interface LoginResponseData {
  token: string;
  id: number;
  email: string;
  role: string; // "Driver" | "Provider" | "Admin" from the backend
  verificationStatus?: string | null;
  reviewNotes?: string | null;
}

const ROLE_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role';

/** Backend role strings ("Provider") -> frontend role strings ("owner"). */
function toFrontendRole(backendRole: string): UserRole {
  const r = (backendRole || '').toLowerCase();
  if (r === 'provider') return 'owner';
  if (r === 'admin') return 'admin';
  return 'driver';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'ew_token';
  private readonly USER_KEY = 'ew_user';
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  // ── Login ────────────────────────────────────────────────────────
  login(email: string, password: string): Observable<{ success: boolean; message?: string }> {
    return this.http.post<ApiResponse<LoginResponseData>>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => {
        if (res.success && res.data?.token) {
          this.persistSession(res.data);
        }
      }),
      map(res => ({ success: res.success, message: res.message }))
    );
  }

  private persistSession(data: LoginResponseData) {
    localStorage.setItem(this.TOKEN_KEY, data.token);

    const localPart = (data.email || '').split('@')[0] || 'User';
    const displayName = localPart
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    const initials = displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase())
      .join('') || 'U';

    const user: User = {
      id: data.id,
      email: data.email,
      role: toFrontendRole(data.role),
      name: displayName,
      initials,
      verificationStatus: data.verificationStatus,
      reviewNotes: data.reviewNotes
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // ── Driver registration (JSON body, no files) ──────────────────
  registerDriver(payload: {
    fullName: string; email: string; phoneNumber: string; password: string; confirmPassword: string;
  }): Observable<ApiResponse<{ id: number }>> {
    return this.http.post<ApiResponse<{ id: number }>>(`${this.apiUrl}/auth/register-driver`, payload);
  }

  // ── Owner/Provider registration (multipart form, includes files) ─
  registerProvider(formData: FormData): Observable<ApiResponse<{ id: number; verificationStatus: string; score: number }>> {
    return this.http.post<ApiResponse<{ id: number; verificationStatus: string; score: number }>>(
      `${this.apiUrl}/auth/register-provider`, formData
    );
  }

  // ── Session helpers ─────────────────────────────────────────────
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    if (isJwtExpired(token)) {
      this.logout();
      return false;
    }
    return true;
  }

  getRole(): UserRole | null {
    return this.getCurrentUser()?.role ?? null;
  }

  /** Re-derives the role straight from the JWT claims (source of truth). */
  getRoleFromToken(): UserRole | null {
    const token = this.getToken();
    if (!token) return null;
    const decoded = decodeJwt(token);
    const raw = decoded?.[ROLE_CLAIM] as string | undefined;
    return raw ? toFrontendRole(raw) : null;
  }

  redirectAfterLogin() {
    const role = this.getRole();
    if (role === 'admin') this.router.navigate(['/admin']);
    else if (role === 'owner') this.router.navigate(['/owner']);
    else this.router.navigate(['/dashboard']);
  }
}
