import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ChatRequestDto {
  message: string;
  latitude?: number;
  longitude?: number;
  batteryPercentage?: number;
}

export interface ChatResponseDto {
  response: string;
  stationId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AiApiService {
  private readonly baseUrl = `${environment.apiUrl}/ai`;

  constructor(private http: HttpClient) {}

  chatWithRag(request: ChatRequestDto): Observable<ChatResponseDto> {
    return this.http.post<ChatResponseDto>(`${this.baseUrl}/rag/chat`, request);
  }
}
