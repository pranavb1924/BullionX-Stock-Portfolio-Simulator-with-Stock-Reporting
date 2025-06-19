import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment'
import { RegisterRequest, LoginRequest, AuthResponse } from '../models/auth.models';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly base = environment.api + '/auth';   // http://localhost:9000/api/auth
  private readonly key  = 'jwt';                       // localStorage key

  constructor(private http: HttpClient) {}

  /** POST /api/auth/register */
  register(body: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.base}/register`, body)
      .pipe(tap(res => this.storeToken(res.token)));
  }

  /** POST /api/auth/login */
  login(body: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.base}/login`, body)
      .pipe(tap(res => this.storeToken(res.token)));
  }

  /** Helpers */
  private storeToken(token: string) {
    localStorage.setItem(this.key, token);
  }
  get token(): string | null {
    return localStorage.getItem(this.key);
  }
  logout() {
    localStorage.removeItem(this.key);
  }
}
