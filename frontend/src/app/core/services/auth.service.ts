import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'vendor' | 'admin';
    is_verified: boolean;
    photo_url?: string;
    phone?: string;
    lat?: number;
    lng?: number;
    locality?: string;
    city?: string;
    analytics_opt_in?: boolean;
    vendor_profile?: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private apiUrl = environment.apiUrl;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    private tokenKey = 'kairo_token';

    constructor(private http: HttpClient) {
        this.loadUser();
    }

    get currentUser(): User | null {
        return this.currentUserSubject.value;
    }

    get isLoggedIn(): boolean {
        return !!this.getToken();
    }

    getToken(): string | null {
        const sessionToken = sessionStorage.getItem(this.tokenKey);
        if (sessionToken) return sessionToken;

        const legacyToken = localStorage.getItem(this.tokenKey);
        if (legacyToken) {
            sessionStorage.setItem(this.tokenKey, legacyToken);
            localStorage.removeItem(this.tokenKey);
            return legacyToken;
        }

        return null;
    }

    private setToken(token: string): void {
        sessionStorage.setItem(this.tokenKey, token);
        localStorage.removeItem(this.tokenKey);
    }

    private clearToken(): void {
        sessionStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.tokenKey);
    }

    ensureUserLoaded(): Observable<User | null> {
        if (this.currentUserSubject.value) {
            return of(this.currentUserSubject.value);
        }

        const token = this.getToken();
        if (!token) {
            return of(null);
        }

        return this.http.get(`${this.apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
        }).pipe(
            tap((res: any) => this.currentUserSubject.next(res.data || null)),
            catchError(() => {
                this.clearToken();
                this.currentUserSubject.next(null);
                return of(null);
            })
        );
    }

    register(data: { name: string; email: string; password: string; role?: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/register`, data, { withCredentials: true });
    }

    verifyOtp(email: string, otp: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/verify-otp`, { email, otp }, { withCredentials: true }).pipe(
            tap((res: any) => {
                if (res.data?.token) {
                    this.setToken(res.data.token);
                    this.currentUserSubject.next(res.data.user);
                }
            })
        );
    }

    login(email: string, password: string): Observable<any> {
        console.log('[AUTH] login() called', { apiUrl: this.apiUrl, email });
        return this.http.post(`${this.apiUrl}/auth/login`, { email, password }, { withCredentials: true }).pipe(
            tap((res: any) => {
                if (res.data?.token) {
                    this.setToken(res.data.token);
                    this.currentUserSubject.next(res.data.user);
                }
            })
        );
    }

    resendOtp(email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/resend-otp`, { email }, { withCredentials: true });
    }

    refreshToken(): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
            tap((res: any) => {
                if (res.data?.token) {
                    this.setToken(res.data.token);
                    if (res.data.user) {
                        this.currentUserSubject.next(res.data.user);
                    }
                }
            })
        );
    }

    loadUser(): void {
        const token = this.getToken();
        if (!token) {
            // No token in localStorage - don't attempt refresh on fresh page load
            return;
        }

        this.fetchMe();
    }

    private fetchMe(): void {
        this.http.get(`${this.apiUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${this.getToken()}` },
            withCredentials: true,
        }).subscribe({
            next: (res: any) => this.currentUserSubject.next(res.data),
            error: () => this.clearToken(),
        });
    }

    logout(): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
            tap(() => {
                this.clearToken();
                this.currentUserSubject.next(null);
            })
        );
    }
}
