import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.isLoggedIn) return true;
    router.navigate(['/auth/login']);
    return false;
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
    return () => {
        const auth = inject(AuthService);
        const router = inject(Router);
        if (!auth.isLoggedIn) {
            return router.createUrlTree(['/auth/login']);
        }

        return auth.ensureUserLoaded().pipe(
            map((user) => {
                if (user && allowedRoles.includes(user.role)) {
                    return true;
                }
                if (user?.role === 'vendor') return router.createUrlTree(['/vendor']);
                if (user?.role === 'admin') return router.createUrlTree(['/admin']);
                if (user?.role === 'customer') return router.createUrlTree(['/home']);
                return router.createUrlTree(['/auth/login']);
            })
        );
    };
};

export const guestGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn) return true;
    const role = auth.currentUser?.role;
    if (role === 'vendor') router.navigate(['/vendor']);
    else if (role === 'admin') router.navigate(['/admin']);
    else router.navigate(['/home']);
    return false;
};
