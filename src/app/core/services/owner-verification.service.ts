import { Injectable } from '@angular/core';

export interface OwnerVerificationData {
  idFrontUrl: string;   // base64 data URL
  idBackUrl: string;    // base64 data URL
  selfieUrl: string;    // base64 data URL
}

export interface OcrResult {
  score: number;          // 0-100 match confidence
  passed: boolean;
  reasons: string[];      // human readable issues found (empty if passed)
  checkedAt: string;
}

export interface OwnerVerificationRecord {
  data: OwnerVerificationData | null;
  ocr: OcrResult | null;
}

/**
 * Mock OCR + identity-verification layer for station owners.
 *
 * In this demo build there's no real backend / OCR engine, so the "score" is a
 * controllable value rather than a real computation — perfect for QA/testing.
 * Swap `runOcrCheck()` for a real API call when a backend is wired up.
 */
@Injectable({ providedIn: 'root' })
export class OwnerVerificationService {
  private readonly STORAGE_KEY = 'ew_owner_verification';

  /**
   * ── TEST KNOB ──────────────────────────────────────────────────────────
   * Fixed score used by the OCR mock. Change this value (or call
   * `setMockScore()` from the browser console) to flip pass/fail without
   * touching component code.
   * Default 92 => passes against the 70-point threshold below.
   */
  private mockScore = 92;
  readonly PASS_THRESHOLD = 70;

  setMockScore(score: number) { this.mockScore = score; }
  getMockScore() { return this.mockScore; }

  /** Runs the (simulated) OCR + face-match check against uploaded documents. */
  runOcrCheck(data: OwnerVerificationData): OcrResult {
    const score = this.mockScore;
    const reasons: string[] = [];

    if (!data.idFrontUrl) reasons.push('Front ID image is missing.');
    if (!data.idBackUrl)  reasons.push('Back ID image is missing.');
    if (!data.selfieUrl)  reasons.push('Selfie image is missing.');

    const passed = score >= this.PASS_THRESHOLD && reasons.length === 0;

    if (!passed && reasons.length === 0) {
      // Score-driven failure — give a plausible OCR-style reason.
      reasons.push(
        score < 40
          ? 'ID image is too blurry or unreadable — please retake the photo.'
          : 'Selfie does not sufficiently match the ID photo. Please retake your selfie in good lighting.'
      );
    }

    const result: OcrResult = { score, passed, reasons, checkedAt: new Date().toISOString() };
    this.saveResult(data, result);
    return result;
  }

  private saveResult(data: OwnerVerificationData, ocr: OcrResult) {
    const record: OwnerVerificationRecord = { data, ocr };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(record));
  }

  getRecord(): OwnerVerificationRecord | null {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  isVerified(): boolean {
    return this.getRecord()?.ocr?.passed ?? false;
  }

  hasRecord(): boolean {
    return !!this.getRecord();
  }

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
