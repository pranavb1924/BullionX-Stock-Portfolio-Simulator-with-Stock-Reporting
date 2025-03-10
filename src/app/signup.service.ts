import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignupService {
  // URL to your Spring Boot backend signup endpoint
  private apiUrl = 'http://localhost:8080/api/signup';

  constructor(private http: HttpClient) {}

  signupUser(userData: any): Observable<string> {
    // The backend returns a plain text message on successful signup
    return this.http.post(this.apiUrl, userData, { responseType: 'text' });
  }
}
