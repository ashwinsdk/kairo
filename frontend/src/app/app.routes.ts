import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent),
    },
    {
        path: 'auth',
        canActivate: [guestGuard],
        loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES),
    },
    {
        path: 'home',
        canActivate: [authGuard],
        loadChildren: () => import('./customer/customer.routes').then(m => m.CUSTOMER_ROUTES),
    },
    {
        path: 'vendor',
        canActivate: [authGuard, roleGuard(['vendor'])],
        loadChildren: () => import('./vendor/vendor.routes').then(m => m.vendorRoutes),
    },
    {
        path: 'admin',
        canActivate: [authGuard, roleGuard(['admin'])],
        loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
    },
    { path: '**', redirectTo: '/home' },
];
