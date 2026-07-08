import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';
import { ConnectorType, PortStatus } from '../../models/enums';

export interface StationListItemDto {
  stationId: number;
  displayName: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  averageRating: number;
  reviewCount: number;
  availablePortsCount: number;
  totalPortsCount: number;
  cheapestPricePerKwh: number | null;
  fastestPowerKw: number | null;
  coverImageUrl: string | null;
  ports?: any[];
}

export interface PortReadDto {
  portId: number;
  stationId: number;
  portCode: string;
  power: number;
  connectorType: ConnectorType;
  pricePerKwh: number;
  status: PortStatus;
  imageUrls: string[];
}

export interface StationDetailDto extends StationListItemDto {
  description: string | null;
  imageUrls: string[];
  ports: PortReadDto[];
}

@Injectable({ providedIn: 'root' })
export class StationApiService {
  private readonly base = `${environment.apiUrl}/stations`;

  constructor(private http: HttpClient) {}

  getAll(lat?: number, lng?: number): Observable<ApiResponse<StationListItemDto[]>> {
    let url = this.base;
    if (lat != null && lng != null) url += `?lat=${lat}&lng=${lng}`;
    return this.http.get<ApiResponse<StationListItemDto[]>>(url);
  }

  getById(id: number, lat?: number, lng?: number): Observable<ApiResponse<StationDetailDto>> {
    let url = `${this.base}/${id}`;
    if (lat != null && lng != null) url += `?lat=${lat}&lng=${lng}`;
    return this.http.get<ApiResponse<StationDetailDto>>(url);
  }

  getPort(portId: number): Observable<ApiResponse<PortReadDto>> {
    return this.http.get<ApiResponse<PortReadDto>>(`${this.base}/ports/${portId}`);
  }
}
