import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/layout/navbar/navbar.component';
import { BookingApiService, BookingReadDto } from '../../../core/services/api/booking-api.service';
import { BookingStatus } from '../../../core/models/enums';

interface HistoryRow {
  id: string;
  station: string;
  date: string;
  energy: string;
  total: string;
  status: 'Paid' | 'Cancelled';
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [RouterModule, CommonModule, NavbarComponent],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  sessions: HistoryRow[] = [];
  loading = true;
  loadError = '';

  sessionsThisMonth = 0;
  energyDelivered = 0;
  totalSpent = 0;

  constructor(private bookingApi: BookingApiService) {}

  ngOnInit() {
    this.loading = true;
    this.bookingApi.getMine().subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) { this.loadError = res.message || 'Could not load your history.'; return; }
        this.buildRows(res.data || []);
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.message || 'Could not load your history.';
      }
    });
  }

  private buildRows(bookings: BookingReadDto[]) {
    const completed = bookings.filter(b => b.chargingSession);
    const now = new Date();

    this.sessions = completed
      .map(b => {
        const cs = b.chargingSession!;
        const date = new Date(cs.endedAt || cs.startedAt);
        return {
          id: 'SESSION-' + cs.sessionId,
          station: b.stationName,
          date: date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
          energy: `${cs.energyKwh} kWh`,
          total: `EGP ${cs.totalAmount.toFixed(2)}`,
          status: (b.status === BookingStatus.Cancelled ? 'Cancelled' : 'Paid') as 'Paid' | 'Cancelled',
          _date: date,
          _energy: cs.energyKwh,
          _total: cs.totalAmount
        };
      })
      .sort((a, b) => b._date.getTime() - a._date.getTime())
      .map(({ _date, _energy, _total, ...rest }) => rest);

    this.sessionsThisMonth = completed.filter(b => {
      const d = new Date(b.chargingSession!.endedAt || b.chargingSession!.startedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    this.energyDelivered = +completed.reduce((sum, b) => sum + b.chargingSession!.energyKwh, 0).toFixed(1);
    this.totalSpent = +completed.reduce((sum, b) => sum + b.chargingSession!.totalAmount, 0).toFixed(2);
  }
}
