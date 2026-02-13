import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-maintenance',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="maint-page">
      <h1 class="page-title">Maintenance Mode</h1>

      <div class="toggle-card">
        <div class="toggle-header">
          <div>
            <h2 class="toggle-title">System Maintenance</h2>
            <p class="toggle-subtitle">
              When enabled, all non-admin users see a maintenance screen. API endpoints return 503.
            </p>
          </div>
        </div>

        <div class="toggle-row">
          <span class="status-label" [class.active]="isEnabled()">
            {{ isEnabled() ? 'ENABLED' : 'DISABLED' }}
          </span>
          <button class="toggle-btn" [class.on]="isEnabled()" (click)="toggle()" [disabled]="toggling()">
            <span class="toggle-knob"></span>
          </button>
        </div>

        @if (isEnabled()) {
          <div class="warning-bar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>Maintenance mode is active. All users except admins are blocked from using the platform.</span>
          </div>
        }
      </div>

      <div class="info-card">
        <h3 class="info-title">What happens during maintenance?</h3>
        <ul class="info-list">
          <li>All customer & vendor requests return a <strong>503 Service Unavailable</strong> response</li>
          <li>Admin users can still access all admin endpoints</li>
          <li>Active bookings are paused — no status transitions allowed</li>
          <li>Chat messages are queued and delivered once maintenance ends</li>
        </ul>
      </div>
    </div>
  `,
    styles: [`
    .maint-page { max-width: 640px; }
    .page-title {
      font-size: 24px; font-weight: 800; color: #fff;
      margin: 0 0 20px; text-transform: uppercase; letter-spacing: 1px;
    }

    .toggle-card {
      background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px;
      margin-bottom: 16px;
    }
    .toggle-header { }
    .toggle-title { font-size: 18px; font-weight: 700; color: #fff; margin: 0 0 4px; }
    .toggle-subtitle { font-size: 13px; color: #666; margin: 0 0 20px; line-height: 1.5; }

    .toggle-row { display: flex; align-items: center; justify-content: space-between; }
    .status-label {
      font-size: 13px; font-weight: 700; color: #555;
      letter-spacing: 1px; font-family: 'Source Code Pro', monospace;
    }
    .status-label.active { color: #ef5350; }

    .toggle-btn {
      width: 56px; height: 30px; border-radius: 15px; border: 2px solid #333;
      background: #222; padding: 2px; cursor: pointer;
      position: relative; transition: all 300ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .toggle-btn.on { background: #ef5350; border-color: #ef5350; }
    .toggle-knob {
      display: block; width: 22px; height: 22px; border-radius: 50%;
      background: #fff; transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .toggle-btn.on .toggle-knob { transform: translateX(26px); }
    .toggle-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .warning-bar {
      display: flex; align-items: flex-start; gap: 10px;
      margin-top: 16px; padding: 12px; background: #2a1a1a;
      border: 1px solid #3a2020; border-radius: 8px;
      color: #ef5350; font-size: 13px; line-height: 1.5;
    }
    .warning-bar svg { flex-shrink: 0; margin-top: 1px; }

    .info-card {
      background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px;
    }
    .info-title { font-size: 15px; font-weight: 700; color: #ccc; margin: 0 0 12px; }
    .info-list {
      margin: 0; padding-left: 20px; color: #888; font-size: 13px;
      list-style: disc; line-height: 2;
    }
    .info-list strong { color: #ccc; font-weight: 600; }
  `],
})
export class MaintenanceComponent implements OnInit {
    isEnabled = signal(false);
    toggling = signal(false);

    constructor(
        private api: ApiService,
        private toast: ToastService,
    ) { }

    ngOnInit() {
        this.api.getMaintenanceStatus().subscribe({
            next: (res: any) => this.isEnabled.set(!!res.data?.enabled),
            error: () => { },
        });
    }

    toggle() {
        this.toggling.set(true);
        const next = !this.isEnabled();
        this.api.toggleMaintenance(next).subscribe({
            next: () => {
                this.isEnabled.set(next);
                this.toast.show(next ? 'Maintenance mode enabled' : 'Maintenance mode disabled', next ? 'warning' : 'success');
                this.toggling.set(false);
            },
            error: (err: any) => {
                this.toast.show(err.error?.message || 'Failed', 'error');
                this.toggling.set(false);
            },
        });
    }
}
