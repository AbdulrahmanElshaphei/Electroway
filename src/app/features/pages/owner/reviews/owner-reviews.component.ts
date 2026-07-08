import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../../shared/components/layout/navbar/navbar.component';
import { OwnerActivityApiService, OwnerReviewReadDto } from '../../../../core/services/api/owner-activity-api.service';

interface DisplayReview {
  initials: string;
  name: string;
  date: string;
  stars: string;
  text: string;
}

@Component({
  selector: 'app-owner-reviews',
  standalone: true,
  imports: [RouterModule, CommonModule, NavbarComponent],
  templateUrl: './owner-reviews.component.html',
  styleUrls: ['./owner-reviews.component.css']
})
export class OwnerReviewsComponent implements OnInit {
  reviews: DisplayReview[] = [];
  private rawRates: number[] = [];
  loading = true;
  loadError = '';

  constructor(private ownerActivityApi: OwnerActivityApiService) {}

  ngOnInit() {
    this.loading = true;
    this.ownerActivityApi.getMyReviews().subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) { this.loadError = res.message || 'Could not load reviews.'; return; }
        const data = res.data || [];
        this.rawRates = data.map(r => r.rate);
        this.reviews = data.map(this.toDisplay);
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.message || 'Could not load reviews.';
      }
    });
  }

  get averageScore(): string {
    if (!this.rawRates.length) return '';
    return (this.rawRates.reduce((a, b) => a + b, 0) / this.rawRates.length).toFixed(1);
  }

  get averageStars(): string {
    if (!this.rawRates.length) return '☆☆☆☆☆';
    const avg = Math.round(this.rawRates.reduce((a, b) => a + b, 0) / this.rawRates.length);
    return '★'.repeat(avg) + '☆'.repeat(5 - avg);
  }

  private toDisplay = (r: OwnerReviewReadDto): DisplayReview => {
    const name = r.driverName || 'Anonymous';
    const initials = name.split(' ').filter(Boolean)[0]?.[0]?.toUpperCase() || '?';
    const date = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      initials,
      name,
      date,
      stars: '★'.repeat(r.rate) + '☆'.repeat(5 - r.rate),
      text: r.comment || '(No comment left)'
    };
  };
}
