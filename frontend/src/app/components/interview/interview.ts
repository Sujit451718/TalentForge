import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../services/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-interview',
  templateUrl: './interview.html',
  styleUrls: ['./interview.css'],
  standalone: false
})
export class Interview implements OnInit, OnDestroy {
  interviewId: string = '';
  currentQuestion: string = '';
  answer: string = '';
  timeLeft: number = 60; // 60 seconds per question
  timer: any;
  loading: boolean = true;
  submitting: boolean = false;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit() {
    this.startNewInterview();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  startNewInterview() {
    this.loading = true;
    this.apiService.startInterview('Software Engineer').subscribe({
      next: (res: any) => {
        this.interviewId = res.data.interview_id;
        this.currentQuestion = res.data.question;
        this.questionContext = res.data.context;
        this.loading = false;
        this.startTimer();
      },
      error: (err) => {
        if (err.status === 403) {
          alert(err.error?.message || 'Daily limit reached. Please upgrade to Premium.');
          this.router.navigate(['/dashboard']);
        } else {
          console.error('Error starting interview:', err);
        }
        this.loading = false;
      }
    });
  }

  startTimer() {
    this.timeLeft = 60;
    this.timer = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.onSubmit();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  onSubmit() {
    if (this.submitting) return;
    
    this.stopTimer();
    this.submitting = true;
    
    const payload = {
      interview_id: this.interviewId,
      question: this.currentQuestion,
      answer: this.answer
    };

    this.apiService.submitAnswer(payload).subscribe({
      next: (res: any) => {
        this.router.navigate(['/feedback', this.interviewId]);
      },
      error: (err) => {
        console.error('Error submitting answer:', err);
        this.submitting = false;
      }
    });
  }
}
