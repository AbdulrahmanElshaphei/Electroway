import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SendAdminNotificationDto {
  targetAudience: string;
  userId?: number;
  type: string;
  title: string;
  message: string;
}

export interface AdminNotificationHistoryDto {
  targetAudience: string;
  type: string;
  title: string;
  message: string;
  sentAt: string;
  reachedUsers: number;
}

export interface AdminNotificationActionResultDto {
  succeeded: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminNotificationsApiService {
  private readonly baseUrl = `${environment.apiUrl}/admin/notifications`;

  constructor(private http: HttpClient) {}

  sendNotification(request: SendAdminNotificationDto): Observable<AdminNotificationActionResultDto> {
    return this.http.post<AdminNotificationActionResultDto>(`${this.baseUrl}/send`, request);
  }

  getSentHistory(): Observable<AdminNotificationHistoryDto[]> {
    return this.http.get<AdminNotificationHistoryDto[]>(`${this.baseUrl}/history`);
  }
}
