import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-vendor-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bookings-page">
      <h1 class="page-title">Bookings</h1>

      <div class="tabs">
        @for (tab of tabs; track tab.key) {
          <button
            class="tab"
            [class.active]="activeTab() === tab.key"
            (click)="activeTab.set(tab.key)"
          >{{ tab.label }}</button>
        }
      </div>

      @if (loading()) {
        @for (i of [1,2,3]; track i) {
          <div class="booking-card skeleton">
            <div class="skeleton-line w70"></div>
            <div class="skeleton-line w50"></div>
          </div>
        }
      }

      @for (booking of filteredBookings(); track booking.id) {
        <a [routerLink]="['/vendor/job', booking.id]" class="booking-card">
          <div class="booking-top">
            <span class="booking-service">{{ booking.service_name }}</span>
            <span class="status-badge" [attr.data-status]="booking.status">{{ booking.status | titlecase }}</span>
          </div>
          <p class="booking-customer">{{ booking.customer_name }}</p>
          <div class="booking-meta">
            <span>{{ booking.scheduled_date | date:'mediumDate' }}</span>
            <span>{{ booking.scheduled_time }}</span>
            <span class="booking-price">₹{{ booking.final_price || booking.estimated_price }}</span>
          </div>
        </a>
      }

      @if (!loading() && filteredBookings().length === 0) {
        <div class="empty">
          <p>No {{ activeTab() }} bookings</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .bookings-page { padding: 16px; }
    .page-title {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      margin: 0 0 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .tabs {
      display: flex;
      gap: 0;
      margin-bottom: 16px;
      border: 1px solid #333;
      border-radius: 8px;
      overflow: hidden;
    }
    .tab {
      flex: 1;
      padding: 10px 4px;
      background: transparent;
      border: none;
      color: #888;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 200ms;
    }
    .tab.active {
      background: linear-gradient(90deg, #00bfa6, #00796b);
      color: #000;
    }
    .booking-card {
      display: block;
      padding: 14px;
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
      text-decoration: none;
      margin-bottom: 8px;
      transition: border-color 200ms;
    }
    .booking-card:hover { border-color: #333; }
    .booking-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .booking-service { font-size: 15px; font-weight: 700; color: #fff; }
    .status-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .status-badge[data-status="requested"] { background: #333; color: #ffc107; }
    .status-badge[data-status="accepted"] { background: #1a3a2a; color: #00bfa6; }
    .status-badge[data-status="on_the_way"] { background: #1a2a3a; color: #42a5f5; }
    .status-badge[data-status="arrived"] { background: #1a2a3a; color: #64b5f6; }
    .status-badge[data-status="in_progress"] { background: #1a2a3a; color: #42a5f5; }
    .status-badge[data-status="completed"] { background: #1a3a2a; color: #66bb6a; }
    .status-badge[data-status="cancelled"] { background: #3a1a1a; color: #ef5350; }
    .status-badge[data-status="rejected"] { background: #3a1a1a; color: #ef5350; }
    .booking-customer { font-size: 13px; color: #888; margin: 0 0 6px; }
    .booking-meta {
      display: flex;
      gap: 8px;
      font-size: 12px;
      color: #666;
    }
    .booking-price { color: #00bfa6; font-weight: 700; margin-left: auto; }
    .empty { text-align: center; padding: 32px; color: #555; }
    .empty p { margin: 0; font-size: 14px; }
    .skeleton { pointer-events: none; }
    .skeleton-line { height: 14px; background: #222; border-radius: 4px; margin-bottom: 8px; animation: shimmer 1.2s ease-in-out infinite; }
    .w70 { width: 70%; }
    .w50 { width: 50%; }
    @keyframes shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
  `],
})
export class VendorBookingsComponent implements OnInit {
  tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Done' },
    { key: 'cancelled', label: 'Cancelled' },
  ];
  activeTab = signal('pending');
  allBookings = signal<any[]>([]);
  loading = signal(true);

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getBookings().subscribe({
      next: (res: any) => {
        this.allBookings.set(res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filteredBookings(): any[] {
    const tab = this.activeTab();
    const bookings = this.allBookings();
    if (tab === 'active') return bookings.filter(b => ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(b.status));
    if (tab === 'completed') return bookings.filter(b => b.status === 'completed');
    if (tab === 'cancelled') return bookings.filter(b => ['cancelled', 'rejected'].includes(b.status));
    return bookings.filter(b => b.status === 'requested');
  }
}
