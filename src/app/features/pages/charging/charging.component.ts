import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/layout/navbar/navbar.component';
import { BookingApiService } from '../../../core/services/api/booking-api.service';

@Component({
  selector: 'app-charging',
  standalone: true,
  imports: [RouterModule, CommonModule, NavbarComponent],
  templateUrl: './charging.component.html',
  styleUrls: ['./charging.component.css']
})
export class ChargingComponent implements OnInit, OnDestroy {
  targetPct = 80;
  currentPct = 42;   // start at 42% (existing battery)
  energyKwh  = 12.4;
  cost       = '4.22';
  elapsedTime = '00:00';
  etaMin     = 18;
  isDone     = false;
  ending     = false;
  endError   = '';

  readonly circumference = 2 * Math.PI * 88; // r=88
  private readonly pricePerKwh = 0.34; // local cost preview only — backend recomputes the real total from the port's real price

  get dashOffset() {
    return this.circumference * (1 - this.currentPct / 100);
  }

  private timer: any;
  private seconds = 0;
  bookingId: number | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private bookingApi: BookingApiService
  ) {}

  ngOnInit() {
    const q = this.route.snapshot.queryParamMap;
    this.bookingId = q.get('bookingId') ? +q.get('bookingId')! : null;

    this.timer = setInterval(() => {
      this.seconds++;
      const m = Math.floor(this.seconds / 60).toString().padStart(2, '0');
      const s = (this.seconds % 60).toString().padStart(2, '0');
      this.elapsedTime = `${m}:${s}`;

      if (this.currentPct < this.targetPct) {
        this.currentPct = Math.min(this.targetPct, this.currentPct + 0.5);
        this.energyKwh  = +(this.energyKwh + 0.15).toFixed(1);
        this.cost       = (this.energyKwh * this.pricePerKwh).toFixed(2);
        this.etaMin     = Math.max(0, this.etaMin - 1);
      } else {
        clearInterval(this.timer);
        this.finishCharging();
      }
    }, 1000);
  }

  stopCharging() {
    clearInterval(this.timer);
    this.finishCharging();
  }

  /** Reports the (simulated) energy delivered to the backend, which computes the real cost from the port's real price. */
  private finishCharging() {
    if (this.ending || this.isDone) return;

    if (!this.bookingId) {
      // No real booking to close out (e.g. page opened directly) — just show the done state.
      this.isDone = true;
      return;
    }

    this.ending = true;
    this.endError = '';

    this.bookingApi.endSession(this.bookingId, this.energyKwh).subscribe({
      next: (res) => {
        this.ending = false;
        this.isDone = true;
        if (res.success) {
          setTimeout(() => this.router.navigate(['/receipt'], {
            queryParams: { sessionId: res.data.sessionId, bookingId: this.bookingId }
          }), 600);
        } else {
          this.endError = res.message || 'Could not finalize the charging session.';
        }
      },
      error: (err) => {
        this.ending = false;
        this.isDone = true;
        this.endError = err?.error?.message || 'Could not finalize the charging session.';
      }
    });
  }

  ngOnDestroy() { clearInterval(this.timer); }
}
