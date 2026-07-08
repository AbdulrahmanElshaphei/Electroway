import { Component, AfterViewInit, NgZone, OnDestroy } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/layout/navbar/navbar.component';

@Component({
  selector: 'app-navigate',
  standalone: true,
  imports: [RouterModule, CommonModule, NavbarComponent],
  templateUrl: './navigate.component.html',
  styleUrls: ['./navigate.component.css']
})
export class NavigateComponent implements AfterViewInit, OnDestroy {
  loading   = true;
  distance  = '—';
  duration  = '—';
  steps: { instructions: string; distance: string }[] = [];

  private map: any = null;
  private L:   any = null;

  // Destination defaults to Nasr City Fast Charge, Cairo — overridden by
  // whatever station the driver picked (passed via query params from
  // station-details.component's `forwardParams`).
  destLat = 30.0626;
  destLng = 31.3450;
  destName = 'Nasr City Fast Charge';
  destAddress = 'Abbas El Akkad St, Nasr City, Cairo';
  bookingId: number | null = null;

  constructor(private zone: NgZone, private route: ActivatedRoute) {
    const q = this.route.snapshot.queryParamMap;
    if (q.get('lat') && q.get('lng')) {
      this.destLat = +q.get('lat')!;
      this.destLng = +q.get('lng')!;
      this.destName = q.get('name') || this.destName;
      this.destAddress = q.get('address') || this.destAddress;
    }
    this.bookingId = q.get('bookingId') ? +q.get('bookingId')! : null;
  }

  ngAfterViewInit() { this.loadLeaflet(); }

  private loadLeaflet() {
    if (!document.getElementById('leaflet-css')) {
      const l = document.createElement('link');
      l.id = 'leaflet-css'; l.rel = 'stylesheet';
      l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(l);
    }
    if ((window as any)['L']) { this.L = (window as any)['L']; this.getLocation(); return; }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => this.zone.run(() => { this.L = (window as any)['L']; this.getLocation(); });
    document.head.appendChild(s);
  }

  private getLocation() {
    // Default starting point: a short drive from the destination, in the
    // same city, so there's always a sensible route to draw even when
    // geolocation is unavailable or denied.
    const fallbackLat = this.destLat + 0.01;
    const fallbackLng = this.destLng - 0.01;

    if (!navigator.geolocation) { this.buildMap(fallbackLat, fallbackLng); return; }
    navigator.geolocation.getCurrentPosition(
      p  => this.zone.run(() => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        // OSRM's public demo router can't draw a route across oceans/continents.
        // If the user's real GPS position is implausibly far from the
        // destination (e.g. testing from a different country), fall back to
        // a nearby point so routing still works for the demo.
        const distDeg = Math.hypot(lat - this.destLat, lng - this.destLng);
        const tooFar = distDeg > 5; // ~500km+
        this.buildMap(tooFar ? fallbackLat : lat, tooFar ? fallbackLng : lng);
      }),
      () => this.zone.run(() => this.buildMap(fallbackLat, fallbackLng)),
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  private buildMap(userLat: number, userLng: number) {
    const el = document.getElementById('nav-gmap');
    if (!el || !this.L) return;
    const L = this.L;

    // Init map centered between user & destination
    const midLat = (userLat + this.destLat) / 2;
    const midLng = (userLng + this.destLng) / 2;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.map = L.map('nav-gmap', { zoomControl:true }).setView([midLat, midLng], 13);

    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '© Google Maps', maxZoom: 20,
    }).addTo(this.map);

    // User location marker (blue dot)
    const userIcon = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;background:#3b82f6;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 6px rgba(59,130,246,.2),0 2px 6px rgba(0,0,0,.3)"></div>`,
      iconSize: [16,16], iconAnchor: [8,8],
    });
    L.marker([userLat, userLng], { icon:userIcon, zIndexOffset:1000 })
     .addTo(this.map).bindPopup('<strong>Your location</strong>');

    // Destination marker (green pin)
    const destIcon = L.divIcon({
      className: '',
      html: `<div style="width:40px;height:40px;background:#22c55e;border-radius:50%;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px">⚡</div>`,
      iconSize: [40,40], iconAnchor: [20,20],
    });
    L.marker([this.destLat, this.destLng], { icon:destIcon })
     .addTo(this.map)
     .bindPopup(`<strong>${this.destName}</strong><br><small>${this.destAddress}</small>`)
     .openPopup();

    // ── Auto-fetch OSRM route immediately (like pressing Start in Google Maps) ──
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${this.destLng},${this.destLat}?overview=full&geometries=geojson&steps=true&annotations=false`;

    fetch(osrmUrl)
      .then(r => r.json())
      .then(data => this.zone.run(() => {
        this.loading = false;
        if (!data.routes?.length) return;

        const route  = data.routes[0];
        const meters = route.distance as number;
        const secs   = route.duration as number;

        this.distance = meters > 1609
          ? (meters / 1609.34).toFixed(1) + ' mi'
          : Math.round(meters) + ' m';
        this.duration = secs >= 3600
          ? Math.floor(secs/3600) + ' hr ' + Math.floor((secs%3600)/60) + ' min'
          : Math.round(secs/60) + ' min';

        // Draw modern Google-Maps style route
        const coords: [number,number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        L.polyline(coords, { color:'#1e3a8a', weight:8, opacity:0.3 }).addTo(this.map); // Outline shadow
        L.polyline(coords, { color:'#3b82f6', weight:5, opacity:1.0 }).addTo(this.map); // Main blue line

        // Fit map to show full route with padding, limiting max zoom so it doesn't look blank
        this.map.fitBounds(L.latLngBounds(coords), { padding:[50,50], maxZoom: 16 });

        // Parse turn-by-turn steps
        const rawSteps = route.legs?.[0]?.steps ?? [];
        this.steps = rawSteps
          .slice(0, 10)
          .map((s: any) => {
            const type = s.maneuver?.type ?? '';
            const mod  = s.maneuver?.modifier ?? '';
            let instr  = this.maneuverLabel(type, mod);
            if (s.name) instr += ` on ${s.name}`;
            return {
              instructions: instr,
              distance: s.distance > 1609
                ? (s.distance/1609.34).toFixed(1)+' mi'
                : Math.round(s.distance)+'m',
            };
          })
          .filter((s: any) => s.instructions.trim());
      }))
      .catch(() => this.zone.run(() => { this.loading = false; }));
  }

  private maneuverLabel(type: string, modifier?: string): string {
    if (type === 'arrive')        return 'Arrive at destination';
    if (type === 'depart')        return 'Head';
    if (type === 'roundabout')    return 'Take the roundabout';
    if (type === 'rotary')        return 'Take the rotary';
    if (modifier === 'left')      return 'Turn left';
    if (modifier === 'right')     return 'Turn right';
    if (modifier === 'slight left')  return 'Slight left';
    if (modifier === 'slight right') return 'Slight right';
    if (modifier === 'sharp left')   return 'Sharp left';
    if (modifier === 'sharp right')  return 'Sharp right';
    if (modifier === 'straight')     return 'Continue straight';
    if (modifier === 'uturn')        return 'Make a U-turn';
    return type ? type.charAt(0).toUpperCase()+type.slice(1) : 'Continue';
  }

  ngOnDestroy() { if (this.map) { this.map.remove(); this.map = null; } }
}
