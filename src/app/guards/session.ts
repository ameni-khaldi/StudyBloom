import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = () => inject(AuthService).isAuthenticated() || inject(Router).createUrlTree(['/login']);
export const studentGuard: CanActivateFn = () => !inject(AuthService).isAdmin() || inject(Router).createUrlTree(['/admin']);
export const roleGuard: CanActivateFn = () => inject(AuthService).isAdmin() || inject(Router).createUrlTree(['/dashboard']);
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return !auth.isAuthenticated() || inject(Router).createUrlTree([auth.isAdmin() ? '/admin' : '/dashboard']);
};
