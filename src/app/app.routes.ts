import { Routes } from '@angular/router';
import { roleGuard } from './core/services/auth.guard';

export const routes: Routes = [
  // ── Public ──────────────────────────────────────────────────────
  { path: '',         loadComponent: () => import('./features/pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'login',    loadComponent: () => import('./core/pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./core/pages/register/register.component').then(m => m.RegisterComponent) },

  // ── Driver ──────────────────────────────────────────────────────
  { path: 'dashboard',       canActivate:[roleGuard('driver')], loadComponent: () => import('./features/pages/map/map.component').then(m => m.MapComponent) },
  { path: 'stations/:id',    canActivate:[roleGuard('driver')], loadComponent: () => import('./features/pages/station-details/station-details.component').then(m => m.StationDetailsComponent) },
  { path: 'booking',         canActivate:[roleGuard('driver')], loadComponent: () => import('./features/pages/booking/booking.component').then(m => m.BookingComponent) },
  { path: 'navigate',        canActivate:[roleGuard('driver')], loadComponent: () => import('./features/pages/navigate/navigate.component').then(m => m.NavigateComponent) },
  { path: 'scan',            canActivate:[roleGuard('driver')], loadComponent: () => import('./features/pages/scan/scan.component').then(m => m.ScanComponent) },
  { path: 'charging',        canActivate:[roleGuard('driver')], loadComponent: () => import('./features/pages/charging/charging.component').then(m => m.ChargingComponent) },
  { path: 'receipt',         canActivate:[roleGuard('driver')], loadComponent: () => import('./features/pages/receipt/receipt.component').then(m => m.ReceiptComponent) },
  { path: 'payment',         canActivate:[roleGuard('driver')], loadComponent: () => import('./features/pages/payment/payment.component').then(m => m.PaymentComponent) },
  { path: 'payment-success', canActivate:[roleGuard('driver')], loadComponent: () => import('./features/pages/payment-success/payment-success.component').then(m => m.PaymentSuccessComponent) },
  { path: 'history',         canActivate:[roleGuard('driver')], loadComponent: () => import('./features/pages/history/history.component').then(m => m.HistoryComponent) },
  { path: 'favorites',       canActivate:[roleGuard('driver')], loadComponent: () => import('./features/pages/favorites/favorites.component').then(m => m.FavoritesComponent) },
  { path: 'notifications',   canActivate:[roleGuard('driver')], loadComponent: () => import('./features/pages/notifications/notifications.component').then(m => m.NotificationsComponent) },

  // ── Owner ───────────────────────────────────────────────────────
  { path: 'owner',                  canActivate:[roleGuard('owner')], loadComponent: () => import('./features/pages/owner/dashboard/owner-dashboard.component').then(m => m.OwnerDashboardComponent) },
  { path: 'owner/stations',         canActivate:[roleGuard('owner')], loadComponent: () => import('./features/pages/owner/stations/owner-stations.component').then(m => m.OwnerStationsComponent) },
  { path: 'owner/transactions',     canActivate:[roleGuard('owner')], loadComponent: () => import('./features/pages/owner/transactions/owner-transactions.component').then(m => m.OwnerTransactionsComponent) },
  { path: 'owner/reviews',          canActivate:[roleGuard('owner')], loadComponent: () => import('./features/pages/owner/reviews/owner-reviews.component').then(m => m.OwnerReviewsComponent) },
  { path: 'owner/bookings', canActivate:[roleGuard('owner')], loadComponent: () => import('./features/pages/owner/bookings/owner-bookings.component').then(m => m.OwnerBookingsComponent) },
  { path: 'owner/withdrawal',       canActivate:[roleGuard('owner')], loadComponent: () => import('./features/pages/owner/withdrawal/withdrawal.component').then(m => m.WithdrawalComponent) },
  { path: 'owner/notifications',    canActivate:[roleGuard('owner')], loadComponent: () => import('./features/pages/owner/notifications/owner-notifications.component').then(m => m.OwnerNotificationsComponent) },

  // ── Admin ───────────────────────────────────────────────────────
  { path: 'admin',               canActivate:[roleGuard('admin')], loadComponent: () => import('./features/pages/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
  { path: 'admin/users',         canActivate:[roleGuard('admin')], loadComponent: () => import('./features/pages/admin/manage-users/manage-users.component').then(m => m.ManageUsersComponent) },
  { path: 'admin/users/:id',     canActivate:[roleGuard('admin')], loadComponent: () => import('./features/pages/admin/user-details/user-details.component').then(m => m.UserDetailsComponent) },
  { path: 'admin/stations',      canActivate:[roleGuard('admin')], loadComponent: () => import('./features/pages/admin/manage-stations/manage-stations.component').then(m => m.ManageStationsComponent) },
  { path: 'admin/stations/:id',  canActivate:[roleGuard('admin')], loadComponent: () => import('./features/pages/admin/station-review/station-review.component').then(m => m.StationReviewComponent) },
  { path: 'admin/notifications', canActivate:[roleGuard('admin')], loadComponent: () => import('./features/pages/admin/notifications-center/notifications-center.component').then(m => m.NotificationsCenterComponent) },
  { path: 'admin/transactions',  canActivate:[roleGuard('admin')], loadComponent: () => import('./features/pages/admin/all-transactions/all-transactions.component').then(m => m.AllTransactionsComponent) },
  { path: 'admin/withdrawals',   canActivate:[roleGuard('admin')], loadComponent: () => import('./features/pages/admin/withdrawal-requests/withdrawal-requests.component').then(m => m.WithdrawalRequestsComponent) },
  { path: 'admin/settings',      canActivate:[roleGuard('admin')], loadComponent: () => import('./features/pages/admin/settings/admin-settings.component').then(m => m.AdminSettingsComponent) },

  { path: '**', redirectTo: '' }
];
