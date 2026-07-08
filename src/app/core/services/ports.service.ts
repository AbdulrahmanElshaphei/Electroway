import { Injectable } from '@angular/core';

export interface ChargingPort {
  id: string;
  speed: number;
  price: string;
  status: 'Pending' | 'Available' | 'Busy' | 'Out of Service' | 'Rejected';
  connector?: string;
  notes?: string;
  ownerName?: string;
  stationName?: string;
  address?: string;
  lat?: number;
  lng?: number;
  rating?: string;
  submittedAt?: string;
  rejectionReason?: string;
  images?: { url: string; name: string }[];
}

/**
 * Shared, app-wide registry of charging ports.
 *
 * This app has no real backend, so this service (backed by localStorage)
 * is the single source of truth that lets the Owner Dashboard and the
 * Admin "Manage Ports" screen stay in sync:
 *  - Owner adds a port  -> status starts as 'Pending'
 *  - Admin approves/rejects that exact port individually
 *  - Drivers (map) should only ever see ports with status 'Available' or 'Busy'
 *
 * There is no separate "station" concept anymore — a "station" on the map
 * is just a group of ports that share the same stationName/address/lat/lng.
 */
@Injectable({ providedIn: 'root' })
export class PortsService {
  private readonly STORAGE_KEY = 'ew_ports_registry';
  // Bump this whenever the shape/seed of mock data changes so old data
  // cached in the browser's localStorage gets replaced automatically.
  private readonly SEED_VERSION = '3';
  private readonly VERSION_KEY = 'ew_ports_registry_version';

  private seedPorts: ChargingPort[] = [
    // Cairo — Nasr City
    { id:'P-01A', speed:250, price:'4.50', status:'Available',     connector:'CCS',    ownerName:'Mahmoud Saeed',   stationName:'Nasr City Fast Charge',     address:'Abbas El Akkad St, Nasr City, Cairo', lat:30.0626, lng:31.3450, rating:'4.8' },
    { id:'P-02A', speed:250, price:'4.50', status:'Busy',          connector:'CCS',    ownerName:'Mahmoud Saeed',   stationName:'Nasr City Fast Charge',     address:'Abbas El Akkad St, Nasr City, Cairo', lat:30.0626, lng:31.3450, rating:'4.8' },

    // Giza — Mall of Egypt area
    { id:'P-03A', speed:150, price:'3.90', status:'Available',     connector:'Type 2', ownerName:'Sara Adel',       stationName:'6th of October Hub',        address:'Mall of Egypt, 6th of October City',  lat:29.9762, lng:30.9494, rating:'4.6' },
    { id:'P-04A', speed:150, price:'3.90', status:'Out of Service',connector:'CHAdeMO',ownerName:'Sara Adel',       stationName:'6th of October Hub',        address:'Mall of Egypt, 6th of October City',  lat:29.9762, lng:30.9494, rating:'4.6' },

    // New Cairo — Fifth Settlement
    { id:'P-05A', speed:50,  price:'3.20', status:'Available',     connector:'CCS',    ownerName:'Omar Hassan',     stationName:'Fifth Settlement Charge Point', address:'90th St, New Cairo',              lat:30.0271, lng:31.4730, rating:'4.9' },
    { id:'P-06A', speed:50,  price:'3.20', status:'Busy',          connector:'Type 2', ownerName:'Omar Hassan',     stationName:'Fifth Settlement Charge Point', address:'90th St, New Cairo',              lat:30.0271, lng:31.4730, rating:'4.9' },

    // Alexandria — Corniche
    { id:'P-07A', speed:180, price:'4.10', status:'Available',     connector:'CCS',    ownerName:'Heba Mostafa',    stationName:'Alexandria Corniche Charge',    address:'Corniche Rd, Alexandria',         lat:31.2156, lng:29.9553, rating:'4.7' },

    // Giza — near the Pyramids (Haram St)
    { id:'P-08A', speed:120, price:'3.75', status:'Pending',       connector:'CCS',    ownerName:'Khaled Ibrahim',  stationName:'Haram Quick Charge',        address:'Al Haram St, Giza',                   lat:29.9897, lng:31.1313,
      images:[
        { url:'https://placehold.co/600x400/16a34a/ffffff?text=Port+Front', name:'port-front.jpg' },
        { url:'https://placehold.co/600x400/0ea5e9/ffffff?text=Port+Side',  name:'port-side.jpg' },
        { url:'https://placehold.co/600x400/64748b/ffffff?text=Connector',  name:'connector.jpg' },
      ] },

    // Mansoura — Talkha Rd
    { id:'P-09A', speed:60,  price:'3.10', status:'Pending',       connector:'Type 2', ownerName:'Nourhan Fathy',   stationName:'Mansoura Charge Station',   address:'Talkha Rd, Mansoura',                 lat:31.0409, lng:31.3785,
      images:[
        { url:'https://placehold.co/600x400/16a34a/ffffff?text=Port+Front', name:'port-front.jpg' },
        { url:'https://placehold.co/600x400/64748b/ffffff?text=Connector',  name:'connector.jpg' },
      ] },

    // Cairo — Maadi
    { id:'P-10A', speed:150, price:'4.00', status:'Rejected',      connector:'CHAdeMO',ownerName:'Mahmoud Saeed',   stationName:'Maadi Riverside Charge',    address:'Corniche El Nil, Maadi, Cairo',       lat:29.9602, lng:31.2569, rejectionReason:'Submitted port photos do not clearly show the connector type.' },
  ];

  /** Wipes any old/stale cached data when the seed shape changes. */
  private ensureFreshSeed() {
    const cachedVersion = localStorage.getItem(this.VERSION_KEY);
    if (cachedVersion !== this.SEED_VERSION) {
      this.write(this.seedPorts);
      localStorage.setItem(this.VERSION_KEY, this.SEED_VERSION);
    }
  }

  private read(): ChargingPort[] {
    this.ensureFreshSeed();
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : this.seedPorts;
  }

  private write(ports: ChargingPort[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ports));
  }

  getAll(): ChargingPort[] { return this.read(); }

  getByOwner(ownerName: string): ChargingPort[] {
    return this.read().filter(p => p.ownerName === ownerName);
  }

  getPending(): ChargingPort[] {
    return this.read().filter(p => p.status === 'Pending');
  }

  /** Only ports drivers are allowed to discover/book. */
  getDriverVisible(): ChargingPort[] {
    return this.read().filter(p => p.status === 'Available' || p.status === 'Busy');
  }

  add(port: ChargingPort) {
    const ports = this.read();
    ports.push({ ...port, submittedAt: new Date().toISOString() });
    this.write(ports);
  }

  update(id: string, changes: Partial<ChargingPort>) {
    const ports = this.read();
    const idx = ports.findIndex(p => p.id === id);
    if (idx > -1) {
      ports[idx] = { ...ports[idx], ...changes };
      this.write(ports);
    }
  }

  approve(id: string) { this.update(id, { status: 'Available', rejectionReason: undefined }); }
  reject(id: string, reason: string) { this.update(id, { status: 'Rejected', rejectionReason: reason }); }
}
