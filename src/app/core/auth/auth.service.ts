import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, delay, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiBaseService } from '../api/api-base.service';
import { BranchContextService } from '../branch/branch-context.service';
import { MOCK_USER } from '../data/mock-data';
import {
  decryptFromClientStorage,
  encryptForClientStorage,
} from '../utils/client-crypto.util';
import { AuthSession, AuthUser, LoginResponse } from '../models';
import { buildLoginRequestBody } from '../utils/auth-login.util';
import { unsealAuthUser } from '../utils/auth-user-pii.util';
import { memberPiiEncryptionEnabled } from '../utils/member-pii-rx.util';
import { StaffService } from '../services/staff.service';
import { messageFromHttpError } from '../utils/api-error.util';

const SESSION_KEY = 'gym_auth_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiBaseService);
  private readonly router = inject(Router);
  private readonly branchContext = inject(BranchContextService);
  private readonly staffService = inject(StaffService);

  private readonly _session = signal<AuthSession | null>(null);

  readonly session = this._session.asReadonly();
  readonly user = computed(() => this._session()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this._session()?.accessToken);
  readonly roles = computed(() => this._session()?.user?.roles ?? []);

  restoreSessionFromStorage(): Promise<void> {
    return this.loadSessionAsync().then((session) => {
      this._session.set(session);
      if (session) {
        this.branchContext.initialize(session.user.branches, session.user.organization.multiBranch);
      }
    });
  }

  login(email: string, password: string): Observable<LoginResponse> {
    if (environment.useMockApi) {
      return from(this.tryMockLogin(email, password)).pipe(
        switchMap((result) => {
          if (!result) {
            return throwError(() => new Error('Invalid email or password'));
          }
          return of(result);
        }),
        catchError((err: unknown) =>
          throwError(() => new Error(messageFromHttpError(err, 'Login failed')))
        ),
        delay(400),
        switchMap((res) =>
          from(unsealAuthUser(res.user)).pipe(
            map((user) => {
              const full: LoginResponse = { ...res, user };
              this.applySession(full);
              return full;
            })
          )
        )
      );
    }
    return from(buildLoginRequestBody(email, password)).pipe(
      switchMap((body) => this.api['post']<LoginResponse>('/auth/login', body)),
      switchMap((res) =>
        from(unsealAuthUser(res.user)).pipe(
          map((user) => {
            const full: LoginResponse = { ...res, user };
            this.applySession(full);
            return full;
          })
        )
      ),
      catchError((err: unknown) => {
        const message = messageFromHttpError(err, 'Invalid email or password');
        return throwError(() => new Error(message));
      })
    );
  }

  logout(): void {
    this._session.set(null);
    localStorage.removeItem(SESSION_KEY);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return this._session()?.accessToken ?? null;
  }

  hasRole(...roles: string[]): boolean {
    const userRoles = this.roles();
    return roles.some((r) => userRoles.includes(r as never));
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((r) => this.roles().includes(r as never));
  }

  refreshMe(): Observable<AuthUser> {
    if (environment.useMockApi) {
      return of(MOCK_USER).pipe(
        delay(200),
        switchMap((u) => from(unsealAuthUser(u))),
        tap((u) => this.patchUser(u))
      );
    }
    return this.api['get']<AuthUser>('/auth/me').pipe(
      switchMap((u) => from(unsealAuthUser(u))),
      tap((u) => this.patchUser(u))
    );
  }

  private applySession(response: LoginResponse): void {
    const session: AuthSession = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt: Date.now() + response.expiresIn * 1000,
      user: response.user,
    };
    this._session.set(session);
    void this.persistSession(session);
    this.branchContext.initialize(response.user.branches, response.user.organization.multiBranch);
  }

  private patchUser(user: AuthUser): void {
    const current = this._session();
    if (!current) return;
    const updated = { ...current, user };
    this._session.set(updated);
    void this.persistSession(updated);
    this.branchContext.initialize(user.branches, user.organization.multiBranch);
  }

  private async persistSession(session: AuthSession): Promise<void> {
    try {
      const json = JSON.stringify(session);
      const payload = await encryptForClientStorage(json, environment.clientStorageSecret);
      localStorage.setItem(SESSION_KEY, payload);
    } catch (err) {
      console.error('[AuthService] Failed to encrypt session for storage', err);
    }
  }

  private async loadSessionAsync(): Promise<AuthSession | null> {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;

      let json: string;
      try {
        json = await decryptFromClientStorage(raw, environment.clientStorageSecret);
      } catch {
        json = raw;
      }

      const session = JSON.parse(json) as AuthSession;
      if (session.expiresAt < Date.now()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      if (memberPiiEncryptionEnabled()) {
        session.user = await unsealAuthUser(session.user);
      }

      if (raw.trim().startsWith('{')) {
        void this.persistSession(session);
      }

      return session;
    } catch {
      return null;
    }
  }

  private async tryMockLogin(email: string, password: string): Promise<LoginResponse | null> {
    if (password !== 'password') {
      return null;
    }
    const normalized = email.trim().toLowerCase();
    const deactivatedMessage =
      'This account has been deactivated. Contact your administrator.';
    const mockStaff = this.staffService.findMockByEmail(normalized);
    if (mockStaff && !mockStaff.isActive) {
      throw new Error(deactivatedMessage);
    }
    if (normalized === 'admin@gym.com') {
      return {
        accessToken: 'mock-admin-token',
        refreshToken: 'mock-refresh',
        expiresIn: 3600,
        user: {
          ...MOCK_USER,
          email: 'admin@gym.com',
          fullName: 'Admin User',
          roles: ['SUPER_ADMIN', 'BRANCH_MANAGER'],
        },
      };
    }
    if (normalized === 'reception@gym.com' || normalized === 'receptionist@gym.com') {
      return {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        user: {
          ...MOCK_USER,
          id: normalized === 'receptionist@gym.com' ? 13 : 12,
          email: normalized,
          fullName: normalized === 'receptionist@gym.com' ? 'Reception Test User' : MOCK_USER.fullName,
          roles: ['RECEPTIONIST'],
        },
      };
    }
    return null;
  }
}
