import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="admin-dashboard">
      <h1 class="page-title">Dashboard</h1>

      @if (loading()) {
        <div class="kpi-grid">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="kpi-card skeleton">
              <div class="skeleton-line w60"></div>
              <div class="skeleton-line w40"></div>
            </div>
          }
        </div>
      } @else {
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-value">{{ stats().vendor_count + stats().customer_count }}</span>
            <span class="kpi-label">Total Users</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-value">{{ stats().vendor_count }}</span>
            <span class="kpi-label">Vendors</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-value">{{ stats().customer_count }}</span>
            <span class="kpi-label">Customers</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-value">{{ stats().pending_bookings }}</span>
            <span class="kpi-label">Bookings</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-value">{{ stats().pending_kyc }}</span>
            <span class="kpi-label">Pending KYC</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-value">₹{{ stats().total_earnings }}</span>
            <span class="kpi-label">Revenue</span>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="quick-links">
          <a routerLink="/admin/kyc" class="quick-link">
            <span class="ql-count">{{ stats().pending_kyc }}</span>
            <span class="ql-label">pending KYC reviews</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
          <a routerLink="/admin/users" class="quick-link">
            <span class="ql-count">{{ stats().pending_bookings }}</span>
            <span class="ql-label">active bookings</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        </div>

        <!-- Recent Admin Actions -->
        <section class="section">
          <h2 class="section-title">Recent Actions</h2>
          @for (action of recentActions(); track action.id) {
            <div class="action-card">
              <div class="action-info">
                <span class="action-type">{{ action.action }}</span>
                <span class="action-detail">{{ action.details }}</span>
              </div>
              <span class="action-time">{{ action.created_at | date:'short' }}</span>
            </div>
          }
          @if (recentActions().length === 0) {
            <div class="empty"><p>No recent actions</p></div>
          }
        </section>
      }
    </div>
  `,
    styles: [`
    .admin-dashboard { }
    .page-title {
      font-size: 24px; font-weight: 800; color: #fff;
      margin: 0 0 24px; text-transform: uppercase; letter-spacing: 1px;
    }
    .kpi-grid {
      display: grid; grid-template-columns: repeat(2, 1fr);
      gap: 8px; margin-bottom: 24px;
    }
    @media (min-width: 600px) {
      .kpi-grid { grid-template-columns: repeat(3, 1fr); }
    }
    .kpi-card {
      padding: 16px; background: #111; border: 1px solid #222;
      border-radius: 8px; text-align: center;
    }
    .kpi-value {
      display: block; font-size: 24px; font-weight: 800; color: #fff;
      font-family: 'Source Code Pro', monospace; margin-bottom: 4px;
    }
    .kpi-label {
      font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .quick-links {
      display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px;
    }
    .quick-link {
      display: flex; align-items: center; gap: 8px; padding: 14px;
      background: #111; border: 1px solid #222; border-radius: 8px;
      text-decoration: none; transition: border-color 200ms;
    }
    .quick-link:hover { border-color: #00bfa6; }
    .ql-count {
      font-size: 18px; font-weight: 800; color: #00bfa6;
      font-family: 'Source Code Pro', monospace;
    }
    .ql-label { font-size: 14px; color: #888; flex: 1; }
    .quick-link svg { color: #444; }
    .section { margin-bottom: 24px; }
    .section-title {
      font-size: 16px; font-weight: 700; color: #fff;
      margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;
    }
    .action-card {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px; background: #111; border: 1px solid #222;
      border-radius: 6px; margin-bottom: 4px;
    }
    .action-info { display: flex; flex-direction: column; gap: 2px; }
    .action-type { font-size: 13px; font-weight: 600; color: #ccc; text-transform: capitalize; }
    .action-detail { font-size: 12px; color: #666; }
    .action-time { font-size: 11px; color: #555; font-family: 'Source Code Pro', monospace; white-space: nowrap; }
    .empty { text-align: center; padding: 24px; color: #555; }
    .empty p { margin: 0; font-size: 14px; }
    .skeleton { pointer-events: none; }
    .skeleton-line { height: 14px; background: #222; border-radius: 4px; margin-bottom: 8px; animation: shimmer 1.2s ease-in-out infinite; }
    .w60 { width: 60%; margin: 0 auto; }
    .w40 { width: 40%; margin: 0 auto; }
    @keyframes shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
  `],
})
export class AdminDashboardComponent implements OnInit {
    stats = signal<any>({});
    recentActions = signal<any[]>([]);
    loading = signal(true);

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.api.getAdminDashboard().subscribe({
            next: (res: any) => {
                this.stats.set(res.data || {});
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });

        this.api.getAdminActions().subscribe({
            next: (res: any) => {
                this.recentActions.set((res.data || []).slice(0, 10));
            },
        });
    }
}
