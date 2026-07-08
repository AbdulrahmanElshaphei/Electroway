import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/layout/navbar/navbar.component';
import { FavoriteApiService, FavoriteReadDto } from '../../../core/services/api/favorite-api.service';

const GRADIENTS = [
  'linear-gradient(135deg,#dcfce7,#e0f2fe)',
  'linear-gradient(135deg,#e0f2fe,#ede9fe)',
  'linear-gradient(135deg,#fef3c7,#dcfce7)',
  'linear-gradient(135deg,#dcfce7,#f0fdf4)',
  'linear-gradient(135deg,#ede9fe,#e0f2fe)',
];

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [RouterModule, CommonModule, NavbarComponent],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit {
  favorites: FavoriteReadDto[] = [];
  loading = true;
  loadError = '';
  removingId: number | null = null;

  constructor(private favoriteApi: FavoriteApiService) {}

  ngOnInit() { this.load(); }

  private load() {
    this.loading = true;
    this.favoriteApi.getMine().subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) { this.loadError = res.message || 'Could not load your favorites.'; return; }
        this.favorites = res.data || [];
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.message || 'Could not load your favorites.';
      }
    });
  }

  gradientFor(i: number): string { return GRADIENTS[i % GRADIENTS.length]; }

  remove(stationId: number, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.removingId) return;
    this.removingId = stationId;

    this.favoriteApi.remove(stationId).subscribe({
      next: (res) => {
        this.removingId = null;
        if (res.success) this.favorites = this.favorites.filter(f => f.stationId !== stationId);
      },
      error: () => { this.removingId = null; }
    });
  }
}
