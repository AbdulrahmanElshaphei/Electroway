import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';
import { WithdrawalMethod, WithdrawalStatus } from '../../models/enums';

export interface WalletSummaryDto {
  totalEarned: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  availableBalance: number;
}

export interface WithdrawalReadDto {
  withdrawalId: number;
  amount: number;
  method: WithdrawalMethod;
  accountDetails: string;
  status: WithdrawalStatus;
  rejectionReason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class WithdrawalApiService {
  private readonly base = `${environment.apiUrl}/owner/withdrawals`;

  constructor(private http: HttpClient) {}

  getWallet(): Observable<ApiResponse<WalletSummaryDto>> {
    return this.http.get<ApiResponse<WalletSummaryDto>>(`${this.base}/wallet`);
  }

  getMine(): Observable<ApiResponse<WithdrawalReadDto[]>> {
    return this.http.get<ApiResponse<WithdrawalReadDto[]>>(this.base);
  }

  request(amount: number, method: WithdrawalMethod, accountDetails: string): Observable<ApiResponse<WithdrawalReadDto>> {
    return this.http.post<ApiResponse<WithdrawalReadDto>>(this.base, { amount, method, accountDetails });
  }
}
