import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/layout/navbar/navbar.component';
import { OwnerActivityApiService, OwnerBookingReadDto } from '../../../../core/services/api/owner-activity-api.service';
import { BookingStatus, SessionStatus } from '../../../../core/models/enums';

type DisplayStatus = 'Confirmed' | 'Active' | 'Completed' | 'Cancelled';

interface DisplayBooking {
  id: string;
  driverName: string;
  driverEmail: string;
  driverInitials: string;
  port: string;
  speed: number;
  priceKwh: string;
  date: string;
  time: string;
  duration: string;
  estCost: string;
  status: DisplayStatus;
}

@Component({
  selector: 'app-owner-bookings',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, NavbarComponent],
  templateUrl: './owner-bookings.component.html',
  styleUrls: ['./owner-bookings.component.css']
})
export class OwnerBookingsComponent implements OnInit {
  tab        = 'all';
  search     = '';
  portFilter = '';
  selectedBooking: DisplayBooking | null = null;
  loading = true;
  loadError = '';

  tabs = [
    { key:'all',       label:'All' },
    { key:'Confirmed', label:'Confirmed' },
    { key:'Active',    label:'Active' },
    { key:'Completed', label:'Completed' },
    { key:'Cancelled', label:'Cancelled' },
  ];

  ports: string[] = [];
  bookings: DisplayBooking[] = [];

  constructor(private ownerActivityApi: OwnerActivityApiService) {}

  ngOnInit() { this.load(); }

  private load() {
    this.loading = true;
    this.ownerActivityApi.getMyBookings().subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) { this.loadError = res.message || 'Could not load bookings.'; return; }
        this.bookings = (res.data || []).map(this.toDisplay);
        this.ports = [...new Set(this.bookings.map(b => b.port))];
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.message || 'Could not load bookings.';
      }
    });
  }

  private toDisplay = (b: OwnerBookingReadDto): DisplayBooking => {
    const date = new Date(b.scheduledAt);
    const initials = (b.driverName || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';

    let status: DisplayStatus = 'Confirmed';
    if (b.status === BookingStatus.Cancelled || b.status === BookingStatus.Expired) status = 'Cancelled';
    else if (b.status === BookingStatus.Completed) status = 'Completed';
    else if (b.sessionStatus === SessionStatus.InProgress || b.sessionStatus === SessionStatus.Started) status = 'Active';
    else status = 'Confirmed';

    const energy = b.energyKwh ?? 0;
    const estCost = b.totalAmount != null ? `EGP ${b.totalAmount.toFixed(2)}` : `~EGP ${(energy * b.pricePerKwh).toFixed(2)}`;

    return {
      id: 'BK-' + b.bookingId,
      driverName: b.driverName,
      driverEmail: b.driverEmail,
      driverInitials: initials,
      port: b.portCode,
      speed: b.power,
      priceKwh: String(b.pricePerKwh),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      duration: b.energyKwh ? `${b.energyKwh} kWh delivered` : '—',
      estCost,
      status
    };
  };

  // ── Filters ────────────────────────────────────────────
  filtered(): DisplayBooking[] {
    return this.bookings.filter(b => {
      const matchTab    = this.tab === 'all' || b.status === this.tab;
      const matchPort   = !this.portFilter || b.port === this.portFilter;
      const matchSearch = !this.search ||
        b.id.toLowerCase().includes(this.search.toLowerCase()) ||
        b.driverName.toLowerCase().includes(this.search.toLowerCase()) ||
        b.port.toLowerCase().includes(this.search.toLowerCase());
      return matchTab && matchPort && matchSearch;
    });
  }

  countByTab(key: string) {
    return this.bookings.filter(b => b.status === key).length;
  }

  // ── Stats ───────────────────────────────────────────────
  todayCount() {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return this.bookings.filter(b => b.date === today).length;
  }
  upcomingCount()  { return this.bookings.filter(b => b.status === 'Confirmed').length; }
  cancelledCount() { return this.bookings.filter(b => b.status === 'Cancelled').length; }

  // ⚡ Actions ⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡
  viewDetails(b: DisplayBooking) { this.selectedBooking = b; }

  cancelBooking(b: DisplayBooking) {
    if (!confirm(`Are you sure you want to cancel booking ${b.id}?`)) return;
    
    // Extract numeric ID from 'BK-123'
    const idNum = parseInt(b.id.replace('BK-', ''), 10);
    
    this.ownerActivityApi.cancelBooking(idNum).subscribe({
      next: (res) => {
        if (res.success) {
          b.status = 'Cancelled';
          if (this.selectedBooking?.id === b.id) {
            this.selectedBooking.status = 'Cancelled';
          }
        } else {
          alert(res.message || 'Failed to cancel booking');
        }
      },
      error: (err) => {
        alert(err?.error?.message || 'Error cancelling booking');
      }
    });
  }

  // ── CSV Export ──────────────────────────────────────────
  exportCSV() {
    const rows = this.filtered();
    const headers = ['Booking ID','Driver','Email','Port','Date','Time','Duration','Est. Cost','Status'];
    const data = rows.map(b =>
      [b.id, b.driverName, b.driverEmail, b.port, b.date, b.time, b.duration, b.estCost, b.status]
    );
    const csv = [headers, ...data]
      .map(row => row.map(c => `"${String(c).replace(/"/g,'""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `bookings-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
