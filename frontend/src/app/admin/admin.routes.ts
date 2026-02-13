import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
            { path: 'kyc', loadComponent: () => import('./kyc/kyc-verification.component').then(m => m.KycVerificationComponent) },
            { path: 'users', loadComponent: () => import('./users/user-management.component').then(m => m.UserManagementComponent) },
            { path: 'maintenance', loadComponent: () => import('./maintenance/maintenance.component').then(m => m.MaintenanceComponent) },
        ],
    },
];
