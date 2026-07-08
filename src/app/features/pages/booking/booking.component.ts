import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StationApiService, StationDetailDto, PortReadDto } from '../../../core/services/api/station-api.service';
import { BookingApiService } from '../../../core/services/api/booking-api.service';

@Component({ selector:'app-booking', standalone:true, imports:[RouterModule,CommonModule], templateUrl:'./booking.component.html', styleUrls:['./booking.component.css'] })
export class BookingComponent implements OnInit {
  stationId = 0;
  portId = 0;
  station: StationDetailDto | null = null;
  port: PortReadDto | null = null;

  loading = true;
  loadError = '';
  confirming = false;
  confirmError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stationApi: StationApiService,
    private bookingApi: BookingApiService
  ) {}

  ngOnInit() {
    const q = this.route.snapshot.queryParamMap;
    this.stationId = +(q.get('stationId') || 0);
    this.portId = +(q.get('portId') || 0);

    if (!this.stationId || !this.portId) {
      this.loadError = 'Missing station or port — please pick a charger from the map first.';
      this.loading = false;
      return;
    }

    this.stationApi.getById(this.stationId).subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) { this.loadError = res.message || 'Could not load this station.'; return; }
        this.station = res.data;
        this.port = res.data.ports.find((p: PortReadDto) => p.portId === this.portId) || res.data.ports.find((p: PortReadDto) => p.status === 1) || res.data.ports[0] || null;
        if (!this.port) this.loadError = 'This port is no longer available.';
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.message || 'Could not load this station.';
      }
    });
  }

  get estimatedEnergyKwh(): number {
    return 35; // placeholder estimate until real telemetry/target-% input exists
  }

  get estimatedCost(): number {
    if (!this.port) return 0;
    return Math.round(this.estimatedEnergyKwh * this.port.pricePerKwh * 100) / 100;
  }

  confirmBooking() {
    if (!this.port || this.confirming) return;
    this.confirming = true;
    this.confirmError = '';

    this.bookingApi.create(this.port.portId).subscribe({
      next: (res) => {
        this.confirming = false;
        if (!res.success) { this.confirmError = res.message || 'Could not create the booking.'; return; }
        this.router.navigate(['/navigate'], {
          queryParams: {
            bookingId: res.data.bookingId,
            name: this.station?.displayName,
            address: this.station?.address,
            lat: this.station?.latitude,
            lng: this.station?.longitude
          }
        });
      },
      error: (err) => {
        this.confirming = false;
        this.confirmError = err?.error?.message || 'Could not create the booking.';
      }
    });
  }
}
