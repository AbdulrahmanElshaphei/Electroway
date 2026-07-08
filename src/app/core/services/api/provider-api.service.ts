import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../models/api-response.model';
import { DocumentStatus, DocumentType, VerificationStatus } from '../../models/enums';

export interface ProviderDocumentReadDto {
  documentId: number;
  documentType: DocumentType;
  status: DocumentStatus;
  uploadedAt: string;
}

export interface ProviderProfileReadDto {
  providerId: number;
  userId: number;
  verificationStatus: VerificationStatus;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  documents: ProviderDocumentReadDto[];
}

export interface OcrResultDto {
  isValid: boolean;
  score: number;
  reason: string;
  verificationStatus: VerificationStatus;
}

@Injectable({ providedIn: 'root' })
export class ProviderApiService {
  private readonly base = `${environment.apiUrl}/provider`;

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<ApiResponse<ProviderProfileReadDto>> {
    return this.http.get<ApiResponse<ProviderProfileReadDto>>(`${this.base}/profile`);
  }

  /** frontId/backId/selfie must be real File objects — same "Edit your data" flow as registration. */
  resubmitVerification(frontId: File, backId: File, selfie: File): Observable<ApiResponse<OcrResultDto>> {
    const formData = new FormData();
    formData.append('FrontId', frontId);
    formData.append('BackId', backId);
    formData.append('SelfieWithId', selfie);
    return this.http.post<ApiResponse<OcrResultDto>>(`${this.base}/verification/resubmit`, formData);
  }
}
