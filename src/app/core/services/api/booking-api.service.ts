import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';
import { BookingStatus, SessionStatus } from '../../models/enums';

export interface ChargingSessionReadDto {
  sessionId: number;
  bookingId: number;
  startedAt: string;
  endedAt: string | null;
  energyKwh: number;
  totalAmount: number;
  status: SessionStatus;
}

export interface BookingReadDto {
  bookingId: number;
  portId: number;
  portCode: string;
  stationId: number;
  stationName: string;
  stationAddress: string;
  startDate: string;
  endDate: string;
  scheduledAt: string;
  status: BookingStatus;
  cancelledAt: string | null;
  reasonOfCancellation: string | null;
  chargingSession: ChargingSessionReadDto | null;
}

@Injectable({ providedIn: 'root' })
export class BookingApiService {
  private readonly base = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  create(portId: number, scheduledAt?: string): Observable<ApiResponse<BookingReadDto>> {
    return this.http.post<ApiResponse<BookingReadDto>>(this.base, { portId, scheduledAt: scheduledAt ?? null });
  }

  getMine(): Observable<ApiResponse<BookingReadDto[]>> {
    return this.http.get<ApiResponse<BookingReadDto[]>>(this.base);
  }

  getById(id: number): Observable<ApiResponse<BookingReadDto>> {
    return this.http.get<ApiResponse<BookingReadDto>>(`${this.base}/${id}`);
  }

  cancel(id: number, reason?: string): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.base}/${id}/cancel`, { reason: reason ?? null });
  }

  startSession(bookingId: number): Observable<ApiResponse<ChargingSessionReadDto>> {
    return this.http.post<ApiResponse<ChargingSessionReadDto>>(`${this.base}/${bookingId}/start-session`, {});
  }

  endSession(bookingId: number, energyKwh: number): Observable<ApiResponse<ChargingSessionReadDto>> {
    return this.http.post<ApiResponse<ChargingSessionReadDto>>(`${this.base}/${bookingId}/end-session`, { energyKwh });
  }
}
