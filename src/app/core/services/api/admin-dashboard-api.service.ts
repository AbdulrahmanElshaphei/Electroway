import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface RecentUserDto {
  userId: number;
  fullName: string;
  email?: string;
  role: string;
  joinedAt: string;
  status: string;
}

export interface PendingPortsApprovalDto {
  portId: number;
  portCode: string;
  providerName: string;
  stationName: string;
  power: number;
  connectorType: string;
  pricePerKwh: number;
}

export interface AdminDashboardStatsDto {
  totalUsers: number;
  totalPorts: number;
  revenueThisMonth: number;
  activeSessions: number;
  recentUsers: RecentUserDto[];
  pendingPortApprovals: PendingPortsApprovalDto[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardApiService {
  private readonly baseUrl = `${environment.apiUrl}/admin/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<AdminDashboardStatsDto> {
    return this.http.get<AdminDashboardStatsDto>(`${this.baseUrl}/stats`);
  }
}
