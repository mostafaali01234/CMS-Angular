import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { decodeJwt } from '../../../shared/utils/jwt';


export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { email: string; password: string; user_name: string; }

interface Session { token: string; refreshToken: string; employeeId: string | number; }

const SESSION_KEY = 'session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly claims = computed(() => decodeJwt(this.token()));
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = `${environment.apiUrl}/authManagement`;
  
  readonly role = computed<string[]>(() => {
    const c = this.claims();
    const r = c?.['role'] ?? c?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return r ? (Array.isArray(r) ? r : [r]) : [];
  });
  readonly userName = computed(() =>
    this.claims()?.['name'] ??
    this.claims()?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ?? null);
  hasRole(role: string): boolean {
    return this.role().includes(role);
  }
  claim<T = string>(name: string): T | null {
    return (this.claims()?.[name] as T) ?? null;
  }

  private _session = signal<Session | null>(this.loadSession());
  private refreshing: Promise<string> | null = null;

  readonly employeeId = computed(() => this._session()?.employeeId ?? null);
  readonly token = computed(() => this._session()?.token ?? null);
  readonly refreshToken = computed(() => this._session()?.refreshToken ?? null);
  readonly isLoggedIn = computed(() => this._session() !== null);

  async login(data: LoginRequest): Promise<void> {
    const res = await firstValueFrom(this.http.post<any>(`${this.baseUrl}/login`, data));
    this.setSession(res);
  }

  async register(data: RegisterRequest): Promise<void> {
    const res = await firstValueFrom(this.http.post<any>(`${this.baseUrl}/register`, data));
    this.setSession(res);
  }

  /** Gets a new access token. Parallel callers share one request. */
  refresh(): Promise<string> {
    if (this.refreshing) return this.refreshing;

    const current = this._session();
    if (!current) return Promise.reject(new Error('No session'));

    this.refreshing = firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/refresh`, {
        token: current.token,
        refreshToken: current.refreshToken
      })
    )
      .then(res => {
        this.setSession(res, current);
        return this._session()!.token;
      })
      .finally(() => (this.refreshing = null));

    return this.refreshing;
  }

  logout() {
    this._session.set(null);
    localStorage.removeItem(SESSION_KEY);
    this.router.navigate(['/auth/login']);
  }

  // accepts either camelCase or PascalCase from the backend
  private setSession(res: any, previous?: Session) {
    const token = res.data.token ?? res.data.Token;
    const refreshToken = res.data.refreshToken ?? res.data.RefreshToken ?? previous?.refreshToken;
    const employeeId = res.data.employeeId ?? res.data.EmployeeId ?? previous?.employeeId;

    if (!token || !refreshToken) {
      throw new Error('Unexpected auth response');
    }

    const session: Session = { token, refreshToken, employeeId };
    this._session.set(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  private loadSession(): Session | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const s = raw ? JSON.parse(raw) : null;
      return s?.token && s?.refreshToken ? s : null;
    } catch {
      return null;
    }
  }
}