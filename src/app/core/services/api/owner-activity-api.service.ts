import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';
import { BookingStatus, PaymentMethod, SessionStatus, TransactionStatus } from '../../models/enums';

export interface OwnerBookingReadDto {
  bookingId: number;
  driverName: string;
  driverEmail: string;
  stationId: number;
  stationName: string;
  portId: number;
  portCode: string;
  power: number;
  pricePerKwh: number;
  scheduledAt: string;
  status: BookingStatus;
  sessionStatus: SessionStatus | null;
  energyKwh: number | null;
  totalAmount: number | null;
}

export interface OwnerTransactionReadDto {
  transactionId: number;
  txCode: string;
  amount: number;
  energyKwh: number;
  platformFee: number;
  ownerProfit: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  paidAt: string | null;
  driverName: string;
  stationName: string;
  portCode: string;
}

export interface OwnerReviewReadDto {
  reviewId: number;
  driverName: string;
  rate: number;
  comment: string | null;
  createdAt: string;
  stationName: string;
  portCode: string;
}

@Injectable({ providedIn: 'root' })
export class OwnerActivityApiService {
  private readonly base = `${environment.apiUrl}/owner`;

  constructor(private http: HttpClient) {}

  getMyBookings(): Observable<ApiResponse<OwnerBookingReadDto[]>> {
    return this.http.get<ApiResponse<OwnerBookingReadDto[]>>(`${this.base}/bookings`);
  }

  getMyTransactions(): Observable<ApiResponse<OwnerTransactionReadDto[]>> {
    return this.http.get<ApiResponse<OwnerTransactionReadDto[]>>(`${this.base}/transactions`);
  }

  getMyReviews(): Observable<ApiResponse<OwnerReviewReadDto[]>> {
    return this.http.get<ApiResponse<OwnerReviewReadDto[]>>(`${this.base}/reviews`);
  }

  cancelBooking(bookingId: number): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.base}/bookings/${bookingId}/cancel`, {});
  }
}
