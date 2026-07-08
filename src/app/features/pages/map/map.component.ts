import { Component, AfterViewInit, NgZone, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/layout/navbar/navbar.component';
import { VehicleApiService, VehicleReadDto } from '../../../core/services/api/vehicle-api.service';
import { StationApiService, StationListItemDto } from '../../../core/services/api/station-api.service';
import { AiApiService } from '../../../core/services/api/ai-api.service';
import { ConnectorType, CONNECTOR_TYPE_LABELS } from '../../../core/models/enums';

interface MapStation {
  id: number;
  name: string;
  address: string;
  rating: string;
  lat: number;
  lng: number;
  status: 'Available' | 'Busy';
  speed: string;
  speedKw: string;
  price: string;
  distLabel: string;
  ports: any[];
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, NavbarComponent],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  aiQuery = '';
  aiChips = ['Find nearest available charger.', 'Find fastest charger.', 'Cheapest station nearby.', 'I have 15% battery.', 'Shortest waiting time.'];
  filters = ['Nearest', 'Fast Charging', 'Cheapest', 'Highest Rated', 'Available Only'];
  activeFilter = 'Nearest';
  selectedStation: MapStation | null = null;
  loadingLocation = true;
  loadingStations = true;
  loadError = '';

  messages: { role: 'bot'|'user'; text: string }[] = [
    { role: 'bot', text: "Hi 👋 I'm your Electro AI assistant. Tell me what kind of charger you need — I'll rank the best options for you." }
  ];

  private map: any = null;
  private L: any = null;
  userLat = 30.0444; // Cairo, Egypt — fallback until geolocation resolves
  userLng = 31.2357;

  stations: MapStation[] = [];

  constructor(
    private zone: NgZone,
    private vehicleApi: VehicleApiService,
    private stationApi: StationApiService,
    private aiApi: AiApiService
  ) {}

  // ── "My Car" popup ────────────────────────────────────────────────
  showCarPopup = false;
  carInfo = { vehicleName: '', brand: '', model: '', batteryCapacity: '', connectorType: ConnectorType.CCS2 as ConnectorType, consumptionRate: '' };
  savedVehicle: VehicleReadDto | null = null;
  carPopupError = '';
  carPopupSaving = false;
  readonly connectorOptions = Object.entries(CONNECTOR_TYPE_LABELS).map(([value, label]) => ({ value: +value, label }));

  ngOnInit() {
    this.loadMyVehicle();
  }

  private loadMyVehicle() {
    this.vehicleApi.getMine().subscribe({
      next: (res) => { this.savedVehicle = res.data?.[0] ?? null; },
      error: () => { /* non-blocking — "Add my car" still works without this */ }
    });
  }

  openCarPopup() {
    this.carPopupError = '';
    if (this.savedVehicle) {
      const v = this.savedVehicle;
      this.carInfo = {
        vehicleName: v.vehicleName, brand: v.brand, model: v.model,
        batteryCapacity: String(v.batteryCapacity), connectorType: v.connectorType,
        consumptionRate: String(v.consumptionRate)
      };
    } else {
      this.carInfo = { vehicleName: '', brand: '', model: '', batteryCapacity: '', connectorType: ConnectorType.CCS2, consumptionRate: '' };
    }
    this.showCarPopup = true;
  }
  closeCarPopup() { this.showCarPopup = false; }

  saveCarInfo() {
    if (!this.carInfo.brand || !this.carInfo.model || !this.carInfo.batteryCapacity) return;
    this.carPopupSaving = true;
    this.carPopupError = '';

    const dto = {
      vehicleName: this.carInfo.vehicleName || `${this.carInfo.brand} ${this.carInfo.model}`,
      brand: this.carInfo.brand,
      model: this.carInfo.model,
      batteryCapacity: +this.carInfo.batteryCapacity,
      connectorType: this.carInfo.connectorType,
      consumptionRate: +this.carInfo.consumptionRate || 1
    };

    const req = this.savedVehicle
      ? this.vehicleApi.update(this.savedVehicle.vehicleId, dto)
      : this.vehicleApi.add(dto);

    req.subscribe({
      next: (res) => {
        this.carPopupSaving = false;
        if (res.success) {
          this.savedVehicle = res.data;
          this.showCarPopup = false;
        } else {
          this.carPopupError = res.message || 'Could not save your vehicle.';
        }
      },
      error: (err) => {
        this.carPopupSaving = false;
        this.carPopupError = err?.error?.message || 'Could not save your vehicle.';
      }
    });
  }

  ngAfterViewInit() { this.loadLeaflet(); }

  private loadLeaflet() {
    if (!document.getElementById('leaflet-css')) {
      const l = document.createElement('link');
      l.id = 'leaflet-css'; l.rel = 'stylesheet';
      l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(l);
    }
    if ((window as any)['L']) { this.L = (window as any)['L']; this.requestLocation(); return; }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => this.zone.run(() => { this.L = (window as any)['L']; this.requestLocation(); });
    document.head.appendChild(s);
  }

  private requestLocation() {
    if (!navigator.geolocation) { this.loadingLocation = false; this.loadStations(); return; }
    navigator.geolocation.getCurrentPosition(
      p  => this.zone.run(() => { this.userLat = p.coords.latitude; this.userLng = p.coords.longitude; this.loadingLocation = false; this.loadStations(); }),
      () => this.zone.run(() => { this.loadingLocation = false; this.loadStations(); }),
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  private loadStations() {
    this.loadingStations = true;
    this.loadError = '';
    this.stationApi.getAll(this.userLat, this.userLng).subscribe({
      next: (res) => {
        this.loadingStations = false;
        if (!res.success) { this.loadError = res.message || 'Could not load stations.'; return; }
        this.stations = (res.data || []).map(this.mapToMapStation);
        this.initMap();
      },
      error: (err) => {
        this.loadingStations = false;
        this.loadError = err?.error?.message || 'Could not reach the server. Please check your connection.';
        this.initMap(); // still show the map with the user's location even if stations failed to load
      }
    });
  }

  private mapToMapStation(s: StationListItemDto): MapStation {
    const speedKw = s.fastestPowerKw ?? 0;
    return {
      id: s.stationId,
      name: s.displayName,
      address: s.address,
      rating: s.averageRating ? s.averageRating.toFixed(1) : '—',
      lat: s.latitude,
      lng: s.longitude,
      status: s.availablePortsCount > 0 ? 'Available' : 'Busy',
      speed: speedKw >= 250 ? 'Ultra Fast' : speedKw >= 100 ? 'Fast' : 'Standard',
      speedKw: speedKw + 'kW',
      price: s.cheapestPricePerKwh != null ? `EGP ${s.cheapestPricePerKwh}/kWh` : '—',
      distLabel: s.distanceKm != null ? `${s.distanceKm.toFixed(1)} km` : '—',
      ports: s.ports || []
    };
  }

  private initMap() {
    const el = document.getElementById('gmap');
    if (!el || !this.L) return;
    const L = this.L;

    this.map = L.map('gmap', { zoomControl: true }).setView([this.userLat, this.userLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    // User dot
    const userIcon = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;background:#3b82f6;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(59,130,246,.25),0 2px 6px rgba(0,0,0,.3)"></div>`,
      iconSize:[16,16], iconAnchor:[8,8],
    });
    L.marker([this.userLat, this.userLng], { icon: userIcon, zIndexOffset:1000 }).addTo(this.map);

    // Station pins
    this.stations.forEach(s => {
      const color = s.status==='Available'?'#22c55e':'#ef4444';
      const pin = L.divIcon({
        className:'',
        html:`<div style="width:36px;height:36px;background:${color};border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;cursor:pointer">⚡</div>`,
        iconSize:[36,36], iconAnchor:[18,18],
      });
      
      let portsHtml = '';
      if (s.ports && s.ports.length > 0) {
        portsHtml = `<div style="margin-top:8px;border-top:1px solid #e5e7eb;padding-top:6px">
          <div style="font-size:10px;font-weight:600;color:#6b7280;margin-bottom:4px">AVAILABLE PORTS (${s.ports.length})</div>
          ${s.ports.map((p:any) => `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-size:11px">
              <div>
                <span style="font-weight:600">${p.portCode}</span>
                <span style="color:#6b7280;margin-left:4px">${p.power}kW</span>
              </div>
              <span style="color:${p.status === 'Available' ? '#16a34a' : '#dc2626'};font-weight:600">
                ${p.status}
              </span>
            </div>
          `).join('')}
        </div>`;
      }

      const popup = `<div style="font-family:Inter,sans-serif;min-width:180px;padding:4px 0">
        <div style="font-size:13px;font-weight:700;margin-bottom:3px">${s.name}</div>
        <div style="font-size:11px;color:#6b7280;margin-bottom:6px">${s.address}</div>
        <div style="display:flex;gap:6px;align-items:center">
          <span style="background:${color};color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px">${s.status}</span>
          <span style="font-size:12px;font-weight:600">${s.price}</span>
        </div>
        ${portsHtml}
      </div>`;
      L.marker([s.lat, s.lng], { icon:pin }).addTo(this.map).bindPopup(popup)
       .on('click', () => this.zone.run(() => this.selectedStation = s));
    });
  }

  selectStation(s: MapStation) {
    this.selectedStation = s;
    if (this.map) this.map.setView([s.lat, s.lng], 15);
  }

  sendChip(c: string) { this.aiQuery = c; this.sendAI(); }

  sendAI() {
    if (!this.aiQuery.trim()) return;
    this.messages.push({ role:'user', text: this.aiQuery });
    const q = this.aiQuery;
    this.aiQuery = '';

    const batteryCap = this.carInfo?.batteryCapacity ? +this.carInfo.batteryCapacity : undefined;
    
    // We can extract battery percentage if the user typed it (e.g. "20%")
    let batteryPercentage: number | undefined = undefined;
    const match = q.match(/(\d+)%/);
    if (match) {
        batteryPercentage = parseInt(match[1]);
    }

    this.aiApi.chatWithRag({
      message: q,
      latitude: this.userLat,
      longitude: this.userLng,
      batteryPercentage: batteryPercentage
    }).subscribe({
        next: (res) => {
          this.messages.push({ role: 'bot', text: res.response });
          this.scrollToBottom();
          
          if (res.stationId) {
            const st = this.stations.find(s => s.id === res.stationId);
            if (st) {
              this.selectStation(st);
            }
          }
        },
        error: (err) => {
        this.messages.push({ role: 'bot', text: "Sorry, I'm having trouble connecting right now." });
        this.scrollToBottom();
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      const elm = this.messagesContainer?.nativeElement;
      if (elm) elm.scrollTop = elm.scrollHeight;
    }, 50);
  }

  ngOnDestroy() { if (this.map) { this.map.remove(); this.map = null; } }
}
