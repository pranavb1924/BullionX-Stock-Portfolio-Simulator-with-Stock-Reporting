// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UserDto          // <-- add this model {id,firstName,lastName,email}
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly base = environment.api + '/auth';   // http://localhost:9000/api/auth
  private readonly key  = 'jwt';

  /** Emits null when logged-out, or the current user DTO */
  private _currentUser$ = new BehaviorSubject<UserDto | null>(null);
  readonly currentUser$ = this._currentUser$.asObservable();

  /** Convenience: emits boolean login state */
  readonly isLoggedIn$  = this.currentUser$.pipe(
    switchMap(user => of(!!user))
  );

  constructor(private http: HttpClient) {
    // 🔹 Auto-login if a token is already present
    const token = localStorage.getItem(this.key);
    if (token) {
      this.fetchMe(token).subscribe({
        next: user => this._currentUser$.next(user),
        error: () => this.clear()                  // silently drop bad / expired token
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  register(body: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.base}/register`, body)
      .pipe(tap(res => this.handleAuth(res)));
  }

  login(body: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.base}/login`, body)
      .pipe(tap(res => this.handleAuth(res)));
  }

  logout() {
    this.clear();
  }

  /** Expose raw JWT if a guard / interceptor needs it */
  get token(): string | null {
    return localStorage.getItem(this.key);
  }

  /* ------------------------------------------------------------------ */
  /*  Internals                                                          */
  /* ------------------------------------------------------------------ */

  /** Save token, push user into BehaviorSubject */
  private handleAuth(res: AuthResponse) {
    this.storeToken(res.token);
    this._currentUser$.next(res.user);
  }

  private storeToken(token: string) {
    localStorage.setItem(this.key, token);
  }

  private clear() {
    localStorage.removeItem(this.key);
    this._currentUser$.next(null);
  }

  /** One-shot call to /api/users/me – used at service start-up */
  private fetchMe(token: string): Observable<UserDto> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<UserDto>(`${environment.api}/users/me`, { headers });
  }
}
