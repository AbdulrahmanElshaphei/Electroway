import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChargeReceiptService, ChargeSession } from '../../../core/services/charge-receipt.service';
import { BookingApiService, BookingReadDto } from '../../../core/services/api/booking-api.service';
import { ReviewApiService } from '../../../core/services/api/review-api.service';

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './receipt.component.html',
  styleUrls: ['./receipt.component.css']
})
export class ReceiptComponent implements OnInit {
  session: ChargeSession | null = null;
  loading = true;
  loadError = '';
  sessionId = 0;
  
  isReviewSubmitted = false;
  reviewRating = 5;
  reviewComment = '';
  submittingReview = false;
  reviewError = '';

  constructor(
    private receiptSvc: ChargeReceiptService,
    private route: ActivatedRoute,
    private bookingApi: BookingApiService,
    private reviewApi: ReviewApiService
  ) {}

  ngOnInit() {
    const q = this.route.snapshot.queryParamMap;
    const bookingId = q.get('bookingId') ? +q.get('bookingId')! : null;

    if (!bookingId) {
      this.loadError = 'Missing booking — please start a charging session first.';
      this.loading = false;
      return;
    }

    this.bookingApi.getById(bookingId).subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success || !res.data.chargingSession) {
          this.loadError = res.message || 'No charging session found for this booking.';
          return;
        }
        this.session = this.mapToChargeSession(res.data);
        this.receiptSvc.save(this.session);
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.message || 'Could not load your receipt.';
      }
    });
  }

  private mapToChargeSession(b: BookingReadDto): ChargeSession {
    const cs = b.chargingSession!;
    this.sessionId = cs.sessionId;

    const startedAt = new Date(cs.startedAt);
    const endedAt = cs.endedAt ? new Date(cs.endedAt) : new Date();
    const durationMin = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));
    const pricePerKwh = cs.energyKwh > 0 ? +(cs.totalAmount / cs.energyKwh).toFixed(2) : 0;

    return {
      stationName: b.stationName,
      portId: b.portCode,
      energyKwh: cs.energyKwh,
      pricePerKwh,
      total: cs.totalAmount,
      dateTime: endedAt.toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
      durationMin,
      transactionId: 'SESSION-' + cs.sessionId
    };
  }

  setRating(stars: number) {
    if (this.submittingReview) return;
    this.reviewRating = stars;
  }

  submitReview() {
    if (this.reviewRating < 1 || this.reviewRating > 5 || this.submittingReview) return;
    this.submittingReview = true;
    this.reviewError = '';

    this.reviewApi.create(this.sessionId, this.reviewRating, this.reviewComment).subscribe({
      next: (res) => {
        this.submittingReview = false;
        if (res.success) {
          this.isReviewSubmitted = true;
        } else {
          this.reviewError = res.message || 'Could not submit your review.';
        }
      },
      error: (err) => {
        this.submittingReview = false;
        this.reviewError = err?.error?.message || 'Could not submit your review.';
      }
    });
  }
}
