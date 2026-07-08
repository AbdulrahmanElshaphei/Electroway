import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';
import { ConnectorType, PortStatus } from '../../models/enums';

export interface OwnerPortReadDto {
  portId: number;
  stationId: number;
  stationName: string;
  portCode: string;
  power: number;
  connectorType: ConnectorType;
  pricePerKwh: number;
  status: PortStatus;
  createdAt: string;
  imageUrls: string[];
}

export interface OwnerPortUpdateDto {
  portCode: string;
  power: number;
  connectorType: ConnectorType;
  pricePerKwh: number;
  markOutOfService: boolean;
}

@Injectable({ providedIn: 'root' })
export class OwnerPortApiService {
  private readonly base = `${environment.apiUrl}/owner/ports`;

  constructor(private http: HttpClient) {}

  getMine(): Observable<ApiResponse<OwnerPortReadDto[]>> {
    return this.http.get<ApiResponse<OwnerPortReadDto[]>>(this.base);
  }

  /**
   * Multipart create — blocked by the backend with a 400 + clear message if
   * the owner's identity verification hasn't passed yet (status !== Verified).
   */
  create(params: {
    stationId: number;
    portCode: string;
    power: number;
    connectorType: ConnectorType;
    pricePerKwh: number;
    notes?: string;
    images?: File[];
  }): Observable<ApiResponse<OwnerPortReadDto>> {
    const formData = new FormData();
    formData.append('StationId', String(params.stationId));
    formData.append('PortCode', params.portCode);
    formData.append('Power', String(params.power));
    formData.append('ConnectorType', String(params.connectorType));
    formData.append('PricePerKwh', String(params.pricePerKwh));
    if (params.notes) formData.append('Notes', params.notes);
    (params.images ?? []).forEach(img => formData.append('Images', img));

    return this.http.post<ApiResponse<OwnerPortReadDto>>(this.base, formData);
  }

  update(id: number, dto: OwnerPortUpdateDto): Observable<ApiResponse<OwnerPortReadDto>> {
    return this.http.put<ApiResponse<OwnerPortReadDto>>(`${this.base}/${id}`, dto);
  }
}
