import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/layout/navbar/navbar.component';
import { StationApiService, StationDetailDto, PortReadDto } from '../../../core/services/api/station-api.service';
import { FavoriteApiService } from '../../../core/services/api/favorite-api.service';
import { ReviewApiService, ReviewReadDto } from '../../../core/services/api/review-api.service';

@Component({
  selector: 'app-station-details',
  standalone: true,
  imports: [RouterModule, CommonModule, NavbarComponent],
  templateUrl: './station-details.component.html',
  styleUrls: ['./station-details.component.css']
})
export class StationDetailsComponent implements OnInit {
  stationId!: number;
  station: StationDetailDto | null = null;
  ports: PortReadDto[] = [];
  reviews: ReviewReadDto[] = [];
  isFavorite = false;
  loading = true;
  loadError = '';
  favoriteBusy = false;

  constructor(
    private route: ActivatedRoute,
    private stationApi: StationApiService,
    private favoriteApi: FavoriteApiService,
    private reviewApi: ReviewApiService
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.stationId = idParam ? +idParam : 0;

    if (!this.stationId) {
      this.loadError = 'Invalid station.';
      this.loading = false;
      return;
    }

    this.loadStation();
    this.loadReviews();
    this.checkFavorite();
  }

  private loadStation() {
    this.loading = true;
    this.stationApi.getById(this.stationId).subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) { this.loadError = res.message || 'Station not found.'; return; }
        this.station = res.data;
        this.ports = res.data.ports || [];
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.message || 'Could not load this station.';
      }
    });
  }

  private loadReviews() {
    this.reviewApi.getForStation(this.stationId).subscribe({
      next: (res) => { this.reviews = res.data || []; },
      error: () => { /* non-blocking */ }
    });
  }

  private checkFavorite() {
    this.favoriteApi.getMine().subscribe({
      next: (res) => { this.isFavorite = (res.data || []).some(f => f.stationId === this.stationId); },
      error: () => { /* non-blocking */ }
    });
  }

  toggleFavorite() {
    if (this.favoriteBusy) return;
    this.favoriteBusy = true;

    if (this.isFavorite) {
      this.favoriteApi.remove(this.stationId).subscribe({
        next: (res) => { this.favoriteBusy = false; if (res.success) this.isFavorite = false; },
        error: () => { this.favoriteBusy = false; }
      });
    } else {
      this.favoriteApi.add(this.stationId).subscribe({
        next: (res) => { this.favoriteBusy = false; if (res.success) this.isFavorite = true; },
        error: () => { this.favoriteBusy = false; }
      });
    }
  }

  starString(rate: number): string {
    const full = Math.round(rate);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  initialsOf(name: string): string {
    return (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
  }

  /** Pass the station+chosen port along to booking/navigate. */
  forwardParams(port?: PortReadDto) {
    if (!this.station) return {};
    return {
      stationId: this.station.stationId,
      portId: port?.portId ?? this.ports[0]?.portId,
      name: this.station.displayName,
      address: this.station.address,
      lat: this.station.latitude,
      lng: this.station.longitude,
    };
  }
}
