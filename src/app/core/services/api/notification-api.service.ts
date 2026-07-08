import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';
import { NotificationType } from '../../models/enums';

export interface NotificationReadDto {
  notificationId: number;
  type: NotificationType;
  title: string;
  messageBody: string;
  isRead: boolean;
  sentAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly base = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getMine(): Observable<ApiResponse<NotificationReadDto[]>> {
    return this.http.get<ApiResponse<NotificationReadDto[]>>(this.base);
  }

  markAsRead(id: number): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.base}/${id}/read`, {});
  }

  markAllAsRead(): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.base}/read-all`, {});
  }
}
