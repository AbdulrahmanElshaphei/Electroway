import { Component, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/layout/navbar/navbar.component';
import { BookingApiService } from '../../../core/services/api/booking-api.service';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [RouterModule, CommonModule, NavbarComponent],
  templateUrl: './scan.component.html',
  styleUrls: ['./scan.component.css']
})
export class ScanComponent implements OnDestroy {
  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;

  cameraActive = false;
  detected = false;
  cameraError = '';
  private stream: MediaStream | null = null;

  bookingId: number | null = null;
  stationName = '';
  startingSession = false;
  sessionError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingApi: BookingApiService
  ) {
    const q = this.route.snapshot.queryParamMap;
    this.bookingId = q.get('bookingId') ? +q.get('bookingId')! : null;
    this.stationName = q.get('name') || '';
  }

  async startCamera() {
    this.cameraError = '';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      this.cameraActive = true;
      // give Angular time to render video element
      setTimeout(() => {
        if (this.videoEl?.nativeElement && this.stream) {
          this.videoEl.nativeElement.srcObject = this.stream;
        }
      }, 100);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        this.cameraError = 'Camera permission denied. Please allow camera access and try again.';
      } else if (err.name === 'NotFoundError') {
        this.cameraError = 'No camera found on this device.';
      } else {
        this.cameraError = 'Could not access camera: ' + err.message;
      }
    }
  }

  simulateScan() {
    this.detected = true;
    this.stopCamera();
  }

  /** Starts the real charging session for this booking, then moves to /charging. */
  startCharging() {
    if (!this.bookingId) {
      this.sessionError = 'Missing booking — please book a port from the map first.';
      return;
    }
    if (this.startingSession) return;
    this.startingSession = true;
    this.sessionError = '';

    this.bookingApi.startSession(this.bookingId).subscribe({
      next: (res) => {
        this.startingSession = false;
        if (!res.success) { this.sessionError = res.message || 'Could not start charging session.'; return; }
        this.router.navigate(['/charging'], {
          queryParams: { bookingId: this.bookingId, sessionId: res.data.sessionId }
        });
      },
      error: (err) => {
        this.startingSession = false;
        this.sessionError = err?.error?.message || 'Could not start charging session.';
      }
    });
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.cameraActive = false;
  }

  ngOnDestroy() { this.stopCamera(); }
}
