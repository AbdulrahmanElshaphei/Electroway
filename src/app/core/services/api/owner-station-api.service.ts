import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';
import { StationStatus } from '../../models/enums';

export interface OwnerStationCreateDto {
  displayName: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string | null;
}

export interface OwnerStationReadDto {
  stationId: number;
  displayName: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string | null;
  status: StationStatus;
  portsCount: number;
  imageUrls: string[];
}

@Injectable({ providedIn: 'root' })
export class OwnerStationApiService {
  private readonly base = `${environment.apiUrl}/owner/stations`;

  constructor(private http: HttpClient) {}

  getMine(): Observable<ApiResponse<OwnerStationReadDto[]>> {
    return this.http.get<ApiResponse<OwnerStationReadDto[]>>(this.base);
  }

  getById(id: number): Observable<ApiResponse<OwnerStationReadDto>> {
    return this.http.get<ApiResponse<OwnerStationReadDto>>(`${this.base}/${id}`);
  }

  create(dto: OwnerStationCreateDto): Observable<ApiResponse<OwnerStationReadDto>> {
    return this.http.post<ApiResponse<OwnerStationReadDto>>(this.base, dto);
  }

  update(id: number, dto: OwnerStationCreateDto): Observable<ApiResponse<OwnerStationReadDto>> {
    return this.http.put<ApiResponse<OwnerStationReadDto>>(`${this.base}/${id}`, dto);
  }
}
