import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';

export interface ReviewReadDto {
  reviewId: number;
  sessionId: number;
  userId: number;
  userName: string;
  rate: number;
  comment: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewApiService {
  private readonly base = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  create(sessionId: number, rate: number, comment?: string): Observable<ApiResponse<ReviewReadDto>> {
    return this.http.post<ApiResponse<ReviewReadDto>>(this.base, { sessionId, rate, comment: comment ?? null });
  }

  getForStation(stationId: number): Observable<ApiResponse<ReviewReadDto[]>> {
    return this.http.get<ApiResponse<ReviewReadDto[]>>(`${this.base}/station/${stationId}`);
  }
}
