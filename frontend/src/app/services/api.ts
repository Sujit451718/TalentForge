import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:5000/api/user';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  getDashboardStats() {
    return this.http.get(`${this.apiUrl}/dashboard`, { headers: this.getHeaders() });
  }

  startInterview(role: string) {
    return this.http.post(`http://localhost:5000/api/interview/start`, { role }, { headers: this.getHeaders() });
  }

  submitAnswer(data: any) {
    return this.http.post(`http://localhost:5000/api/interview/submit-answer`, data, { headers: this.getHeaders() });
  }

  getFeedback(interviewId: string) {
    return this.http.get(`http://localhost:5000/api/interview/feedback/${interviewId}`, { headers: this.getHeaders() });
  }

  upgradePlan() {
    return this.http.post(`${this.apiUrl}/upgrade-plan`, {}, { headers: this.getHeaders() });
  }

  uploadResume(file: File) {
    const formData = new FormData();
    formData.append('resume', file);
    return this.http.post(`${this.apiUrl}/upload-resume`, formData, { headers: this.getHeaders() });
  }

  createCheckoutSession() {
    return this.http.post(`http://localhost:5000/api/payment/create-checkout-session`, {}, { headers: this.getHeaders() });
  }
}
