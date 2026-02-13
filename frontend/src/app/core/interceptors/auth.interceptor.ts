import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, switchMap, filter, take, catchError, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private isRefreshing = false;
    private refreshSubject = new BehaviorSubject<string | null>(null);
    private readonly tokenKey = 'kairo_token';

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.getToken();
        let authReq = req;

        if (token && !req.url.includes('/auth/refresh')) {
            authReq = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` },
            });
        }

        return next.handle(authReq).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/register') && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/verify-otp')) {
                    return this.handle401(authReq, next);
                }
                return throwError(() => error);
            })
        );
    }

    private handle401(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshSubject.next(null);

            const http = inject(HttpClient);
            return http.post(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
                tap((res: any) => {
                    if (res.data?.token) {
                        sessionStorage.setItem(this.tokenKey, res.data.token);
                        localStorage.removeItem(this.tokenKey);
                    }
                }),
                switchMap((res: any) => {
                    this.isRefreshing = false;
                    this.refreshSubject.next(res.data?.token);
                    return next.handle(req.clone({
                        setHeaders: { Authorization: `Bearer ${res.data?.token}` },
                    }));
                }),
                catchError((err) => {
                    this.isRefreshing = false;
                    sessionStorage.removeItem(this.tokenKey);
                    localStorage.removeItem(this.tokenKey);
                    return throwError(() => err);
                })
            );
        }

        return this.refreshSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((token) => next.handle(req.clone({
                setHeaders: { Authorization: `Bearer ${token}` },
            })))
        );
    }

    private getToken(): string | null {
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
}
