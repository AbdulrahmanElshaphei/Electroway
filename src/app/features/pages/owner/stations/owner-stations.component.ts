import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/layout/navbar/navbar.component';
import { OwnerStationApiService, OwnerStationReadDto, OwnerStationCreateDto } from '../../../../core/services/api/owner-station-api.service';

@Component({
  selector: 'app-owner-stations',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, NavbarComponent],
  templateUrl: './owner-stations.component.html',
  styleUrls: ['./owner-stations.component.css']
})
export class OwnerStationsComponent implements OnInit {
  stations: OwnerStationReadDto[] = [];
  loading = true;
  loadError = '';

  showForm = false;
  editingStationId: number | null = null;
  saving = false;
  formError = '';
  form: OwnerStationCreateDto = { displayName:'', address:'', latitude:30.0444, longitude:31.2357, description:'' };

  private map: any = null;
  private L: any = null;
  private marker: any = null;

  constructor(private stationApi: OwnerStationApiService, private zone: NgZone) {}

  ngOnInit() { this.load(); }

  private load() {
    this.loading = true;
    this.stationApi.getMine().subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) { this.loadError = res.message || 'Could not load your stations.'; return; }
        this.stations = res.data || [];
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.message || 'Could not load your stations.';
      }
    });
  }

  openCreate() {
    this.editingStationId = null;
    this.form = { displayName:'', address:'', latitude:30.0444, longitude:31.2357, description:'' };
    this.formError = '';
    this.showForm = true;
    setTimeout(() => this.loadLeaflet(), 100);
  }

  openEdit(s: OwnerStationReadDto) {
    this.editingStationId = s.stationId;
    this.form = { displayName: s.displayName, address: s.address, latitude: s.latitude, longitude: s.longitude, description: s.description || '' };
    this.formError = '';
    this.showForm = true;
    setTimeout(() => this.loadLeaflet(), 100);
  }

  closeForm() { 
    this.showForm = false; 
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  save() {
    if (!this.form.displayName || !this.form.address || this.saving) return;
    this.saving = true;
    this.formError = '';

    const req = this.editingStationId
      ? this.stationApi.update(this.editingStationId, this.form)
      : this.stationApi.create(this.form);

    req.subscribe({
      next: (res) => {
        this.saving = false;
        if (!res.success) { this.formError = res.message || 'Could not save this station.'; return; }

        if (this.editingStationId) {
          const idx = this.stations.findIndex(s => s.stationId === res.data.stationId);
          if (idx > -1) this.stations[idx] = res.data;
        } else {
          this.stations.unshift(res.data);
        }
        this.showForm = false;
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || 'Could not save this station.';
      }
    });
  }

  /** Tries to read the device's current location to prefill lat/lng for a new station. */
  useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => { 
        this.zone.run(() => {
          this.form.latitude = pos.coords.latitude; 
          this.form.longitude = pos.coords.longitude; 
          if (this.map && this.marker) {
            const latLng = [this.form.latitude, this.form.longitude];
            this.map.setView(latLng, 15);
            this.marker.setLatLng(latLng);
          }
        });
      },
      () => { /* ignore — keeps the Cairo default */ }
    );
  }

  private loadLeaflet() {
    if (!document.getElementById('leaflet-css')) {
      const l = document.createElement('link');
      l.id = 'leaflet-css'; l.rel = 'stylesheet';
      l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(l);
    }
    if ((window as any)['L']) { this.L = (window as any)['L']; this.buildMap(); return; }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => this.zone.run(() => { this.L = (window as any)['L']; this.buildMap(); });
    document.head.appendChild(s);
  }

  private buildMap() {
    const el = document.getElementById('station-picker-map');
    if (!el || !this.L) return;
    const L = this.L;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const latLng = [this.form.latitude, this.form.longitude];
    this.map = L.map('station-picker-map').setView(latLng, 13);

    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '© Google Maps', maxZoom: 20,
    }).addTo(this.map);

    const destIcon = L.divIcon({
      className: '',
      html: `<div style="width:40px;height:40px;background:#22c55e;border-radius:50%;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px">📍</div>`,
      iconSize: [40,40], iconAnchor: [20,40],
    });

    this.marker = L.marker(latLng, { icon: destIcon }).addTo(this.map);

    this.map.on('click', (e: any) => {
      this.zone.run(() => {
        this.form.latitude = parseFloat(e.latlng.lat.toFixed(6));
        this.form.longitude = parseFloat(e.latlng.lng.toFixed(6));
        this.marker.setLatLng(e.latlng);
      });
    });
  }

  ngOnDestroy() { 
    if (this.map) { 
      this.map.remove(); 
      this.map = null; 
    } 
  }
}
