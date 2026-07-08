import { Injectable } from '@angular/core';

export interface CarInfo {
  make: string;
  model: string;
  year: string;
  color: string;
  plateNumber: string;
  connectorType: string;
  batteryCapacity: string; // kWh
}

/**
 * Stores the driver's vehicle details so the charging flow (booking,
 * scanning a port, etc.) can reference connector type / battery size.
 * No backend in this demo build, so it's persisted to localStorage.
 */
@Injectable({ providedIn: 'root' })
export class CarInfoService {
  private readonly STORAGE_KEY = 'ew_driver_car_info';

  get(): CarInfo | null {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  save(info: CarInfo) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(info));
  }

  hasInfo(): boolean { return !!this.get(); }

  clear() { localStorage.removeItem(this.STORAGE_KEY); }
}
