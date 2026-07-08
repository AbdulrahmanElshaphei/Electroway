import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminTransactionListItemDto {
  transactionId: number;
  transactionCode: string;
  userName: string;
  stationName: string;
  date: string;
  energyKwh: number;
  amount: number;
  platformFee: number;
  status: string;
}

export interface AdminTransactionsPagedResponseDto {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  transactions: AdminTransactionListItemDto[];
}

export interface AdminTransactionsQueryDto {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface AdminTransactionDetailsDto {
  transactionId: number;
  transactionCode: string;
  userName: string;
  userEmail?: string;
  stationName: string;
  portCode: string;
  date: string;
  energyKwh: number;
  amount: number;
  platformFee: number;
  ownerProfit: number;
  paymentMethod: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminTransactionsApiService {
  private readonly baseUrl = `${environment.apiUrl}/admin/transactions`;

  constructor(private http: HttpClient) {}

  getTransactions(query?: AdminTransactionsQueryDto): Observable<AdminTransactionsPagedResponseDto> {
    let params = new HttpParams();
    if (query) {
      if (query.search) params = params.set('search', query.search);
      if (query.status) params = params.set('status', query.status);
      if (query.startDate) params = params.set('startDate', query.startDate);
      if (query.endDate) params = params.set('endDate', query.endDate);
      if (query.pageNumber) params = params.set('pageNumber', query.pageNumber.toString());
      if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    }
    return this.http.get<AdminTransactionsPagedResponseDto>(this.baseUrl, { params });
  }

  getTransactionDetails(transactionId: number): Observable<AdminTransactionDetailsDto> {
    return this.http.get<AdminTransactionDetailsDto>(`${this.baseUrl}/${transactionId}`);
  }

  exportCsv(query?: AdminTransactionsQueryDto): Observable<Blob> {
    let params = new HttpParams();
    if (query) {
      if (query.search) params = params.set('search', query.search);
      if (query.status) params = params.set('status', query.status);
      if (query.startDate) params = params.set('startDate', query.startDate);
      if (query.endDate) params = params.set('endDate', query.endDate);
    }
    return this.http.get(`${this.baseUrl}/export-csv`, { params, responseType: 'blob' });
  }
}
