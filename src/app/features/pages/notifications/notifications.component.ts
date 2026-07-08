import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/layout/navbar/navbar.component';
import { NotificationApiService, NotificationReadDto } from '../../../core/services/api/notification-api.service';
import { NotificationType } from '../../../core/models/enums';

interface DisplayNotification extends NotificationReadDto {
  filterCategory: 'bookings' | 'payments' | 'charging' | 'other';
  icon: string;
  bg: string;
  color: string;
  timeLabel: string;
}

const TYPE_DISPLAY: Record<NotificationType, { category: DisplayNotification['filterCategory']; icon: string; bg: string; color: string }> = {
  [NotificationType.Booking]:    { category: 'bookings', icon: 'bi-calendar-check-fill',     bg: '#dcfce7', color: '#16a34a' },
  [NotificationType.Session]:    { category: 'charging', icon: 'bi-battery-charging',        bg: '#dcfce7', color: '#16a34a' },
  [NotificationType.Payment]:    { category: 'payments', icon: 'bi-credit-card-fill',        bg: '#fef3c7', color: '#92400e' },
  [NotificationType.Review]:     { category: 'other',    icon: 'bi-star-fill',               bg: '#fef3c7', color: '#92400e' },
  [NotificationType.Approval]:   { category: 'other',    icon: 'bi-shield-check',            bg: '#dbeafe', color: '#1d4ed8' },
  [NotificationType.Withdrawal]: { category: 'other',    icon: 'bi-cash-coin',               bg: '#dbeafe', color: '#1d4ed8' },
  [NotificationType.System]:     { category: 'other',    icon: 'bi-info-circle-fill',        bg: '#f3f4f6', color: '#6b7280' },
};

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [RouterModule, CommonModule, NavbarComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  filter = 'all';
  notifications: DisplayNotification[] = [];
  loading = true;
  loadError = '';

  constructor(private notificationApi: NotificationApiService) {}

  ngOnInit() { this.load(); }

  private load() {
    this.loading = true;
    this.notificationApi.getMine().subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) { this.loadError = res.message || 'Could not load notifications.'; return; }
        this.notifications = (res.data || []).map(this.toDisplay);
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.message || 'Could not load notifications.';
      }
    });
  }

  private toDisplay = (n: NotificationReadDto): DisplayNotification => {
    const d = TYPE_DISPLAY[n.type] || TYPE_DISPLAY[NotificationType.System];
    return { ...n, filterCategory: d.category, icon: d.icon, bg: d.bg, color: d.color, timeLabel: this.relativeTime(n.sentAt) };
  };

  private relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }

  unreadCount() { return this.notifications.filter(n => !n.isRead).length; }

  filtered() {
    if (this.filter === 'all')    return this.notifications;
    if (this.filter === 'unread') return this.notifications.filter(n => !n.isRead);
    return this.notifications.filter(n => n.filterCategory === this.filter);
  }

  markRead(n: DisplayNotification) {
    if (n.isRead) return;
    n.isRead = true; // optimistic
    this.notificationApi.markAsRead(n.notificationId).subscribe({ error: () => { n.isRead = false; } });
  }

  markAllRead() {
    const hadUnread = this.notifications.some(n => !n.isRead);
    if (!hadUnread) return;
    this.notifications.forEach(n => n.isRead = true); // optimistic
    this.notificationApi.markAllAsRead().subscribe({ error: () => this.load() });
  }
}
