import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';
import { ConnectorType } from '../../models/enums';

export interface VehicleReadDto {
  vehicleId: number;
  vehicleName: string;
  brand: string;
  model: string;
  batteryCapacity: number;
  connectorType: ConnectorType;
  consumptionRate: number;
}

export interface VehicleCreateDto {
  vehicleName: string;
  brand: string;
  model: string;
  batteryCapacity: number;
  connectorType: ConnectorType;
  consumptionRate: number;
}

@Injectable({ providedIn: 'root' })
export class VehicleApiService {
  private readonly base = `${environment.apiUrl}/vehicles`;

  constructor(private http: HttpClient) {}

  getMine(): Observable<ApiResponse<VehicleReadDto[]>> {
    return this.http.get<ApiResponse<VehicleReadDto[]>>(this.base);
  }

  add(dto: VehicleCreateDto): Observable<ApiResponse<VehicleReadDto>> {
    return this.http.post<ApiResponse<VehicleReadDto>>(this.base, dto);
  }

  update(id: number, dto: VehicleCreateDto): Observable<ApiResponse<VehicleReadDto>> {
    return this.http.put<ApiResponse<VehicleReadDto>>(`${this.base}/${id}`, dto);
  }

  remove(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${id}`);
  }
}
