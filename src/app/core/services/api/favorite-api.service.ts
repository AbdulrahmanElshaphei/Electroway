import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';

export interface FavoriteReadDto {
  favoriteId: number;
  stationId: number;
  stationName: string;
  stationAddress: string;
  savedAt: string;
}

@Injectable({ providedIn: 'root' })
export class FavoriteApiService {
  private readonly base = `${environment.apiUrl}/favorites`;

  constructor(private http: HttpClient) {}

  getMine(): Observable<ApiResponse<FavoriteReadDto[]>> {
    return this.http.get<ApiResponse<FavoriteReadDto[]>>(this.base);
  }

  add(stationId: number): Observable<ApiResponse<FavoriteReadDto>> {
    return this.http.post<ApiResponse<FavoriteReadDto>>(this.base, { stationId });
  }

  remove(stationId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${stationId}`);
  }
}
