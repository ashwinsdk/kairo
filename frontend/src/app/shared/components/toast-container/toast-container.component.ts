import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-wrapper" aria-live="polite">
      @for (toast of (toastService.toasts$ | async); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.type" role="alert" (click)="toastService.dismiss(toast.id)">
          <span class="toast__message">{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
    styles: [`
    .toast-wrapper {
      position: fixed;
      bottom: 88px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 500;
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 90%;
      max-width: 400px;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      padding: 12px 16px;
      background: #111;
      border-left: 3px solid #00bfa6;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
      animation: slideIn 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .toast--success { border-color: #00c853; }
    .toast--error { border-color: #ff1744; }
    .toast--warning { border-color: #ff9100; }
    .toast--info { border-color: #00b0ff; }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class ToastContainerComponent {
    constructor(public toastService: ToastService) { }
}
