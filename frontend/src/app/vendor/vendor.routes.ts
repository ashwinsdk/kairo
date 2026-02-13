import { Routes } from '@angular/router';

export const vendorRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./layout/vendor-layout.component').then(m => m.VendorLayoutComponent),
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.VendorDashboardComponent) },
            { path: 'bookings', loadComponent: () => import('./bookings/bookings.component').then(m => m.VendorBookingsComponent) },
            { path: 'job/:id', loadComponent: () => import('./job-request/job-request.component').then(m => m.JobRequestComponent) },
            { path: 'earnings', loadComponent: () => import('./earnings/earnings.component').then(m => m.VendorEarningsComponent) },
            { path: 'profile', loadComponent: () => import('./vendor-profile/vendor-profile.component').then(m => m.VendorProfileComponent) },
            { path: 'chat/:bookingId', loadComponent: () => import('../customer/chat/chat.component').then(m => m.ChatComponent) },
        ],
    },
];
