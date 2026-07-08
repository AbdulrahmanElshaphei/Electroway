import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  isLoggedIn = false;
  mobileOpen = false;

  // Contact form
  contactName = '';
  contactEmail = '';
  contactMsg = '';

  features = [
    { icon: 'bi-lightning-charge-fill', title: 'Real-time availability', desc: 'See live status for every charger before you drive there.' },
    { icon: 'bi-robot', title: 'AI charging assistant', desc: 'Ask anything by voice or chat — best route, fastest port, lowest cost.' },
    { icon: 'bi-calendar-check', title: 'Smart booking', desc: 'Reserve a port in advance and skip the wait when you arrive.' },
    { icon: 'bi-shield-lock', title: 'Secure payments', desc: 'Pay by card with bank-grade encryption and instant receipts.' },
  ];

  steps = [
    { title: 'Find a charger', desc: 'Search the live map for available stations near you.' },
    { title: 'Book your station', desc: 'Reserve a port in seconds and get turn-by-turn navigation.' },
    { title: 'Charge your vehicle', desc: 'Scan the QR on the port and start charging instantly.' },
    { title: 'Pay online', desc: 'Pay by card and download a detailed receipt.' },
  ];

  aboutStats = [
    { val: '12k+', label: 'Stations live' },
    { val: '340k', label: 'Drivers' },
    { val: '8.2M', label: 'kWh delivered' },
    { val: '98%', label: 'Charge success' },
  ];

  constructor(private auth: AuthService) { }

  ngOnInit() { this.isLoggedIn = this.auth.isLoggedIn(); }

  goToDashboard() { this.auth.redirectAfterLogin(); }

  sendContact() {
    if (!this.contactName || !this.contactEmail || !this.contactMsg) {
      alert('Please fill in all fields.');
      return;
    }
    alert(`✅ Message sent! We'll get back to you at ${this.contactEmail} within 24h.`);
    this.contactName = ''; this.contactEmail = ''; this.contactMsg = '';
  }
}
