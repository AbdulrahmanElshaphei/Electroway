import { Component, Input, OnInit, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  @Input() role: 'driver' | 'owner' | 'admin' = 'driver';
  user: User | null = null;
  menuOpen   = false;   // avatar dropdown
  mobileOpen = false;   // hamburger drawer

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.user = this.auth.getCurrentUser();
    if (this.user?.role) this.role = this.user.role;
  }

  toggleMenu()   { this.menuOpen   = !this.menuOpen;   this.mobileOpen = false; }
  toggleMobile() { this.mobileOpen = !this.mobileOpen; this.menuOpen   = false; }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const t = e.target as HTMLElement;
    if (!t.closest('.avatar-menu')) this.menuOpen   = false;
    if (!t.closest('.hamburger') && !t.closest('.mobile-drawer')) this.mobileOpen = false;
  }

  // Close drawer on ESC
  @HostListener('document:keydown.escape')
  onEsc() { this.menuOpen = false; this.mobileOpen = false; }

  logout() { this.auth.logout(); }
}
