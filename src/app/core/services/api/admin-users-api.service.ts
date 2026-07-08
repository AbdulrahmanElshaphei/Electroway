import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminUserListItemDto {
  userId: number;
  fullName: string;
  email?: string;
  role: string;
  joinedAt: string;
  sessionsCount: number;
  status: string;
}

export interface AdminUsersPagedResponseDto {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  users: AdminUserListItemDto[];
}

export interface AdminUsersQueryDto {
  search?: string;
  role?: string;
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface AdminUserDetailsDto {
  userId: number;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  joinedAt: string;
  status: string;
  isActive: boolean;
  isBanned: boolean;
  sessionsCount: number;
  bookingsCount: number;
  vehiclesCount: number;
}

export interface AdminUserActionResultDto {
  succeeded: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUsersApiService {
  private readonly baseUrl = `${environment.apiUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  getUsers(query?: AdminUsersQueryDto): Observable<AdminUsersPagedResponseDto> {
    let params = new HttpParams();
    if (query) {
      if (query.search) params = params.set('search', query.search);
      if (query.role) params = params.set('role', query.role);
      if (query.status) params = params.set('status', query.status);
      if (query.pageNumber) params = params.set('pageNumber', query.pageNumber.toString());
      if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    }
    return this.http.get<AdminUsersPagedResponseDto>(this.baseUrl, { params });
  }

  getUserDetails(userId: number): Observable<AdminUserDetailsDto> {
    return this.http.get<AdminUserDetailsDto>(`${this.baseUrl}/${userId}`);
  }

  suspendUser(userId: number): Observable<AdminUserActionResultDto> {
    return this.http.patch<AdminUserActionResultDto>(`${this.baseUrl}/${userId}/suspend`, {});
  }

  activateUser(userId: number): Observable<AdminUserActionResultDto> {
    return this.http.patch<AdminUserActionResultDto>(`${this.baseUrl}/${userId}/activate`, {});
  }
}
