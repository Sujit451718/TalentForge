import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: false
})
export class Dashboard implements OnInit {
  stats: any = {
    name: '',
    total_interviews: 0,
    average_score: 0,
    plan_type: 'free'
  };
  loading = true;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadDashboardData();
    this.checkPaymentStatus();
  }

  checkPaymentStatus() {
    this.route.queryParams.subscribe(params => {
      if (params['success']) {
        alert('Payment Successful! Your account has been upgraded.');
      }
      if (params['canceled']) {
        alert('Payment Canceled.');
      }
    });
  }

  loadDashboardData() {
    this.apiService.getDashboardStats().subscribe({
      next: (res: any) => {
        this.stats = res.data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.loading = false;
      }
    });
  }

  onUpgrade() {
    this.apiService.createCheckoutSession().subscribe({
      next: (res: any) => {
        if (res.data?.url) {
          window.location.href = res.data.url;
        }
      },
      error: (err) => {
        alert('Error initiating checkout. Please try again later.');
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.apiService.uploadResume(file).subscribe({
        next: (res: any) => {
          alert('Resume processed! AI will now use your experience for questions.');
        },
        error: (err) => {
          alert(err.error?.message || 'Error uploading resume.');
        }
      });
    }
  }
}
