import { Injectable } from '@angular/core';

export interface ChargeSession {
  stationName: string;
  portId: string;
  energyKwh: number;
  pricePerKwh: number;
  total: number;
  dateTime: string;     // display string
  durationMin: number;
  transactionId: string;
  cardLast4?: string;
}

/**
 * Carries the current charging session's billing details across the
 * receipt -> payment -> payment-success pages. No backend in this demo,
 * so it's a simple in-memory/session-storage bridge.
 */
@Injectable({ providedIn: 'root' })
export class ChargeReceiptService {
  private readonly STORAGE_KEY = 'ew_active_charge_session';

  private defaultSession(): ChargeSession {
    return {
      stationName: 'Mission Bay Supercharger',
      portId: 'P-04A',
      energyKwh: 32.4,
      pricePerKwh: 0.34,
      total: 11.02,
      dateTime: new Date().toLocaleString('en-US', { month:'numeric', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' }),
      durationMin: 28,
      transactionId: 'TX-' + Math.random().toString(16).slice(2, 10).toUpperCase()
    };
  }

  get(): ChargeSession {
    const raw = sessionStorage.getItem(this.STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const session = this.defaultSession();
    this.save(session);
    return session;
  }

  save(session: ChargeSession) {
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
  }

  setCardLast4(last4: string) {
    const session = this.get();
    session.cardLast4 = last4;
    this.save(session);
  }
}
