import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
    selector: 'app-vendor-earnings',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="earnings-page">
      <h1 class="page-title">Earnings</h1>

      @if (loading()) {
        <div class="skeleton-grid">
          @for (i of [1,2,3,4]; track i) {
            <div class="kpi-card skeleton">
              <div class="skeleton-line w60"></div>
              <div class="skeleton-line w40"></div>
            </div>
          }
        </div>
      } @else {
        <!-- Summary KPIs -->
        <div class="kpi-grid">
          <div class="kpi-card kpi-card--highlight">
            <span class="kpi-value">₹{{ totalEarnings() }}</span>
            <span class="kpi-label">Total Earnings</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-value">₹{{ monthEarnings() }}</span>
            <span class="kpi-label">This Month</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-value">₹{{ weekEarnings() }}</span>
            <span class="kpi-label">This Week</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-value">{{ todayCompleted() }}</span>
            <span class="kpi-label">Today Done</span>
          </div>
        </div>

        <!-- Recent Payments -->
        <section class="section">
          <h2 class="section-title">Recent Payments</h2>
          @for (payment of recentPayments(); track payment.id) {
            <div class="payment-card">
              <div class="payment-info">
                <span class="payment-service">{{ payment.service_name || 'Service' }}</span>
                <span class="payment-date">{{ payment.created_at | date:'mediumDate' }}</span>
              </div>
              <div class="payment-amount" [class.pending]="payment.status !== 'completed'">
                ₹{{ payment.amount }}
              </div>
            </div>
          }
          @if (recentPayments().length === 0) {
            <div class="empty">
              <p>No payments yet</p>
            </div>
          }
        </section>
      }
    </div>
  `,
    styles: [`
    .earnings-page { padding: 16px; }
    .page-title {
      font-size: 22px; font-weight: 800; color: #fff;
      margin: 0 0 20px; text-transform: uppercase; letter-spacing: 1px;
    }
    .kpi-grid {
      display: grid; grid-template-columns: repeat(2, 1fr);
      gap: 8px; margin-bottom: 28px;
    }
    .kpi-card {
      padding: 16px; background: #111; border: 1px solid #222;
      border-radius: 8px; text-align: center;
    }
    .kpi-card--highlight {
      grid-column: 1 / -1;
      border-color: #00bfa6;
      background: linear-gradient(135deg, #0a1a15, #111);
    }
    .kpi-value {
      display: block; font-size: 24px; font-weight: 800; color: #fff;
      margin-bottom: 4px; font-family: 'Source Code Pro', monospace;
    }
    .kpi-card--highlight .kpi-value { font-size: 32px; color: #00bfa6; }
    .kpi-label {
      font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .section { margin-bottom: 24px; }
    .section-title {
      font-size: 16px; font-weight: 700; color: #fff;
      margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;
    }
    .payment-card {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px; background: #111; border: 1px solid #222;
      border-radius: 8px; margin-bottom: 6px;
    }
    .payment-info { display: flex; flex-direction: column; gap: 2px; }
    .payment-service { font-size: 14px; font-weight: 600; color: #ccc; }
    .payment-date { font-size: 12px; color: #555; }
    .payment-amount {
      font-size: 16px; font-weight: 800; color: #00bfa6;
      font-family: 'Source Code Pro', monospace;
    }
    .payment-amount.pending { color: #ffc107; }
    .empty { text-align: center; padding: 32px; color: #555; }
    .empty p { margin: 0; font-size: 14px; }
    .skeleton-grid {
      display: grid; grid-template-columns: repeat(2, 1fr);
      gap: 8px; margin-bottom: 28px;
    }
    .skeleton { pointer-events: none; }
    .skeleton-line { height: 14px; background: #222; border-radius: 4px; margin-bottom: 8px; animation: shimmer 1.2s ease-in-out infinite; }
    .w60 { width: 60%; margin: 0 auto; }
    .w40 { width: 40%; margin: 0 auto; }
    @keyframes shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
  `],
})
export class VendorEarningsComponent implements OnInit {
    totalEarnings = signal(0);
    monthEarnings = signal(0);
    weekEarnings = signal(0);
    todayCompleted = signal(0);
    recentPayments = signal<any[]>([]);
    loading = signal(true);

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.api.getEarnings().subscribe({
            next: (res: any) => {
                this.totalEarnings.set(res.data?.total_earnings || 0);
                this.monthEarnings.set(res.data?.this_month || 0);
                this.weekEarnings.set(res.data?.this_week || 0);
                this.todayCompleted.set(res.data?.today_completed || 0);
                this.recentPayments.set(res.data?.recent_payments || []);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }
}
