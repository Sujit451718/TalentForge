import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.html',
  styleUrls: ['./feedback.css'],
  standalone: false
})
export class Feedback implements OnInit {
  interviewId: string = '';
  feedbackData: any = null;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.interviewId = this.route.snapshot.paramMap.get('id') || '';
    if (this.interviewId) {
      this.loadFeedback();
    }
  }

  loadFeedback() {
    this.apiService.getFeedback(this.interviewId).subscribe({
      next: (res: any) => {
        this.feedbackData = res.data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading feedback:', err);
        this.loading = false;
      }
    });
  }
}
