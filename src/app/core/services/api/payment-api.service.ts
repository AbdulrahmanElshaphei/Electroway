import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';
import { PaymentMethod, TransactionStatus } from '../../models/enums';

export interface PayBySessionDto {
  sessionId: number;
  paymentMethod: PaymentMethod;
  cardHolderName?: string | null;
  cardNumber?: string | null;
  expiry?: string | null;
  cvv?: string | null;
}

export interface TransactionReadDto {
  transactionId: number;
  sessionId: number;
  txCode: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  paidAt: string | null;
  cardLast4: string | null;
}

export interface ReceiptReadDto {
  receiptId: number;
  transactionId: number;
  receiptCode: string;
  totalAmount: number;
  energyKwh: number;
  pricePerKwh: number;
  durationMinutes: number;
  issuedAt: string;
  stationName: string;
  portCode: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private readonly base = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  pay(dto: PayBySessionDto): Observable<ApiResponse<TransactionReadDto>> {
    return this.http.post<ApiResponse<TransactionReadDto>>(`${this.base}/pay`, dto);
  }

  getReceipt(transactionId: number): Observable<ApiResponse<ReceiptReadDto>> {
    return this.http.get<ApiResponse<ReceiptReadDto>>(`${this.base}/receipts/${transactionId}`);
  }
}
