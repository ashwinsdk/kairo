import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private toastsSubject = new BehaviorSubject<Toast[]>([]);
    public toasts$ = this.toastsSubject.asObservable();
    private counter = 0;

    show(message: string, type: Toast['type'] = 'info', duration = 3000): void {
        const toast: Toast = { id: ++this.counter, message, type, duration };
        const current = this.toastsSubject.value;
        this.toastsSubject.next([...current, toast]);

        if (duration > 0) {
            setTimeout(() => this.dismiss(toast.id), duration);
        }
    }

    success(message: string): void { this.show(message, 'success'); }
    error(message: string): void { this.show(message, 'error', 5000); }
    info(message: string): void { this.show(message, 'info'); }
    warning(message: string): void { this.show(message, 'warning', 4000); }

    dismiss(id: number): void {
        const current = this.toastsSubject.value.filter(t => t.id !== id);
        this.toastsSubject.next(current);
    }
}
