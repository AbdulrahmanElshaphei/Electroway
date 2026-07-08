import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminPortListItemDto {
  portId: number;
  portCode: string;
  ownerName: string;
  stationName: string;
  power: number;
  pricePerKwh: number;
  connectorType: string;
  status: string;
}

export interface AdminPortsPagedResponseDto {
  pendingCount: number;
  liveCount: number;
  rejectedCount: number;
  outOfServiceCount: number;
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  ports: AdminPortListItemDto[];
}

export interface AdminPortsQueryDto {
  tab?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface AdminPortDetailsDto {
  portId: number;
  portCode: string;
  ownerName: string;
  ownerEmail?: string;
  stationName: string;
  stationAddress: string;
  power: number;
  pricePerKwh: number;
  connectorType: string;
  status: string;
  qrData?: string;
  createdAt: string;
  imageUrls: string[];
}

export interface AdminPortActionResultDto {
  succeeded: boolean;
  message: string;
}

export interface RejectPortRequestDto {
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminPortsApiService {
  private readonly baseUrl = `${environment.apiUrl}/admin/ports`;

  constructor(private http: HttpClient) {}

  getPorts(query?: AdminPortsQueryDto): Observable<AdminPortsPagedResponseDto> {
    let params = new HttpParams();
    if (query) {
      if (query.tab) params = params.set('tab', query.tab);
      if (query.pageNumber) params = params.set('pageNumber', query.pageNumber.toString());
      if (query.pageSize) params = params.set('pageSize', query.pageSize.toString());
    }
    return this.http.get<AdminPortsPagedResponseDto>(this.baseUrl, { params });
  }

  getPortDetails(portId: number): Observable<AdminPortDetailsDto> {
    return this.http.get<AdminPortDetailsDto>(`${this.baseUrl}/${portId}`);
  }

  approvePort(portId: number): Observable<AdminPortActionResultDto> {
    return this.http.patch<AdminPortActionResultDto>(`${this.baseUrl}/${portId}/approve`, {});
  }

  rejectPort(portId: number, reason: string): Observable<AdminPortActionResultDto> {
    return this.http.patch<AdminPortActionResultDto>(`${this.baseUrl}/${portId}/reject`, { reason } as RejectPortRequestDto);
  }

  markOutOfService(portId: number): Observable<AdminPortActionResultDto> {
    return this.http.patch<AdminPortActionResultDto>(`${this.baseUrl}/${portId}/out-of-service`, {});
  }

  activatePort(portId: number): Observable<AdminPortActionResultDto> {
    return this.http.patch<AdminPortActionResultDto>(`${this.baseUrl}/${portId}/activate`, {});
  }
}
