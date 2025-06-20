// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  /* ------------------------------------------------------------------
   * Public routes
   * ------------------------------------------------------------------ */
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component')
        .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component')
        .then(m => m.RegisterComponent)
  },

  /* ------------------------------------------------------------------
   * Protected routes  (requires valid JWT)
   * ------------------------------------------------------------------ */
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component')
        .then(m => m.DashboardComponent),
    canActivate: [authGuard]            // 🔒 guard in action
  },

  /* ------------------------------------------------------------------
   * Default / Fallback
   * ------------------------------------------------------------------ */
  { path: '',   redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
