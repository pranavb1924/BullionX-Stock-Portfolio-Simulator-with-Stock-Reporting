// src/app/core/guards/auth.guard.ts
import { inject }              from '@angular/core';
import { CanActivateFn }       from '@angular/router';
import { AuthService }         from '../services/auth.service';
import { Router }              from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.token) {
    return true;                               // ✨ already logged-in
  }

  return router.createUrlTree(['/login']);     // 🚪 kick back to /login
};
