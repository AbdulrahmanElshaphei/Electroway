import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminWithdrawalListItemDto {
  withdrawalId: number;
  reference: string;
  ownerName: string;
  amount: number;
  method: string;
  requestedAt: string;
  status: string;
  rejectionReason?: string;
  aiRiskScore?: number;
  aiRecommendation?: string;
}

export interface AdminWithdrawalsPagedResponseDto {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  withdrawals: AdminWithdrawalListItemDto[];
}

export interface AdminWithdrawalsQueryDto {
  tab?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface AdminWithdrawalActionResultDto {
  succeeded: boolean;
  message: string;
}

export interface RejectWithdrawalRequestDto {
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminWithdrawalsApiService {
  private readonly baseUrl = `${environment.apiUrl}/admin/withdrawals`;

  constructor(private http: HttpClient) {}

  getWithdrawals(query?: AdminWithdrawalsQueryDto): Observable<AdminWithdrawalsPagedResponseDto> {
    let params = new HttpParams();
    if (query) {
      if (query.tab) params = params.set('tab', query.tab);
      if (query.pageNumber) params = params.set('pageNumber', query.pageNumber.toString());
      if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    }
    return this.http.get<AdminWithdrawalsPagedResponseDto>(this.baseUrl, { params });
  }

  approveWithdrawal(withdrawalId: number): Observable<AdminWithdrawalActionResultDto> {
    return this.http.patch<AdminWithdrawalActionResultDto>(`${this.baseUrl}/${withdrawalId}/approve`, {});
  }

  rejectWithdrawal(withdrawalId: number, reason: string): Observable<AdminWithdrawalActionResultDto> {
    return this.http.patch<AdminWithdrawalActionResultDto>(`${this.baseUrl}/${withdrawalId}/reject`, { reason } as RejectWithdrawalRequestDto);
  }
}
