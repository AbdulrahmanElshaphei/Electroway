import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from './auth.service';

export function roleGuard(...allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    const role = auth.getRole();
    if (allowedRoles.length && role && !allowedRoles.includes(role)) {
      // redirect to their own home
      if (role === 'admin')       router.navigate(['/admin']);
      else if (role === 'owner')  router.navigate(['/owner']);
      else                        router.navigate(['/dashboard']);
      return false;
    }

    return true;
  };
}
