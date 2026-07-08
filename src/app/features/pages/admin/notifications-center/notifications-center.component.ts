import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/layout/navbar/navbar.component';
import { AdminNotificationsApiService, AdminNotificationHistoryDto } from '../../../../core/services/api/admin-notifications-api.service';

@Component({
  selector: 'app-notifications-center',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, NavbarComponent],
  templateUrl: './notifications-center.component.html',
  styleUrls: ['./notifications-center.component.css']
})
export class NotificationsCenterComponent implements OnInit {
  audience = 'All Users'; 
  targetUser = ''; 
  notifType = 'System'; 
  title = ''; 
  message = '';
  
  sentHistory: AdminNotificationHistoryDto[] = [];

  constructor(private notificationsApi: AdminNotificationsApiService) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.notificationsApi.getSentHistory().subscribe({
      next: (data: AdminNotificationHistoryDto[]) => this.sentHistory = data,
      error: (err: any) => console.error('Failed to load notification history', err)
    });
  }

  getTypeIcon(type?: string) {
    const t = type || this.notifType;
    const m: Record<string, string> = { 
      System: 'bi-info-circle-fill', 
      Approval: 'bi-check-circle-fill', 
      Warning: 'bi-exclamation-triangle-fill', 
      Booking: 'bi-calendar-check-fill',
      Payment: 'bi-credit-card-fill',
      Review: 'bi-star-fill'
    };
    return m[t] || 'bi-bell-fill';
  }

  send() {
    if (!this.title || !this.message) {
      alert('Please enter a title and message.');
      return;
    }

    this.notificationsApi.sendNotification({
      targetAudience: this.audience,
      userId: this.audience === 'Specific User' && this.targetUser ? parseInt(this.targetUser, 10) : undefined,
      type: this.notifType,
      title: this.title,
      message: this.message
    }).subscribe({
      next: () => {
        alert('✅ Notification sent!');
        this.title = '';
        this.message = '';
        this.targetUser = '';
        this.loadHistory();
      },
      error: (err: any) => alert('Failed to send notification: ' + err.message)
    });
  }
}

