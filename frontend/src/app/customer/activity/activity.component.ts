import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="activity-page">
      <h1 class="page-title">Activity</h1>

      <!-- Tabs -->
      <div class="tabs">
        @for (tab of tabs; track tab.key) {
          <button
            class="tab"
            [class.active]="activeTab() === tab.key"
            (click)="activeTab.set(tab.key)"
          >{{ tab.label }}</button>
        }
      </div>

      <!-- Ongoing -->
      @if (activeTab() === 'ongoing') {
        @if (loadingBookings()) {
          @for (i of [1,2]; track i) {
            <div class="booking-card skeleton">
              <div class="skeleton-line w70"></div>
              <div class="skeleton-line w50"></div>
              <div class="skeleton-line w30"></div>
            </div>
          }
        }
        @for (booking of ongoingBookings(); track booking.id) {
          <a [routerLink]="['/home/booking', booking.id]" class="booking-card">
            <div class="booking-card__header">
              <span class="booking-card__service">{{ booking.service_name }}</span>
              <span class="status-badge" [attr.data-status]="booking.status">{{ booking.status | titlecase }}</span>
            </div>
            <p class="booking-card__vendor">{{ booking.vendor_name }}</p>
            <div class="booking-card__meta">
              <span>{{ booking.scheduled_date | date:'mediumDate' }}</span>
              <span>{{ booking.scheduled_time }}</span>
            </div>
            <div class="booking-card__price">₹{{ booking.final_price || booking.estimated_price }}</div>
          </a>
        }
        @if (!loadingBookings() && ongoingBookings().length === 0) {
          <div class="empty">
            <p>No ongoing bookings</p>
            <a routerLink="/home/search" class="cta-btn">Browse Services</a>
          </div>
        }
      }

      <!-- Upcoming -->
      @if (activeTab() === 'upcoming') {
        @for (booking of upcomingBookings(); track booking.id) {
          <a [routerLink]="['/home/booking', booking.id]" class="booking-card">
            <div class="booking-card__header">
              <span class="booking-card__service">{{ booking.service_name }}</span>
              <span class="status-badge" [attr.data-status]="booking.status">{{ booking.status | titlecase }}</span>
            </div>
            <p class="booking-card__vendor">{{ booking.vendor_name }}</p>
            <div class="booking-card__meta">
              <span>{{ booking.scheduled_date | date:'mediumDate' }}</span>
              <span>{{ booking.scheduled_time }}</span>
            </div>
            <div class="booking-card__price">₹{{ booking.final_price || booking.estimated_price }}</div>
          </a>
        }
        @if (!loadingBookings() && upcomingBookings().length === 0) {
          <div class="empty"><p>No upcoming bookings</p></div>
        }
      }

      <!-- Past -->
      @if (activeTab() === 'past') {
        @for (booking of pastBookings(); track booking.id) {
          <a [routerLink]="['/home/booking', booking.id]" class="booking-card booking-card--past">
            <div class="booking-card__header">
              <span class="booking-card__service">{{ booking.service_name }}</span>
              <span class="status-badge" [attr.data-status]="booking.status">{{ booking.status | titlecase }}</span>
            </div>
            <p class="booking-card__vendor">{{ booking.vendor_name }}</p>
            <div class="booking-card__meta">
              <span>{{ booking.scheduled_date | date:'mediumDate' }}</span>
            </div>
            <div class="booking-card__price">₹{{ booking.final_price || booking.estimated_price }}</div>
          </a>
        }
        @if (!loadingBookings() && pastBookings().length === 0) {
          <div class="empty"><p>No past bookings</p></div>
        }
      }
    </div>
  `,
  styles: [`
    .activity-page { padding: 16px; }
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
      margin-bottom: 20px;
      border: 1px solid #333;
      border-radius: 8px;
      overflow: hidden;
    }
    .tab {
      flex: 1;
      padding: 10px;
      background: transparent;
      border: none;
      color: #888;
      font-size: 13px;
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
    .booking-card--past { opacity: 0.7; }
    .booking-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .booking-card__service {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }
    .status-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-badge[data-status="requested"] { background: #333; color: #ffc107; }
    .status-badge[data-status="accepted"] { background: #1a3a2a; color: #00bfa6; }
    .status-badge[data-status="on_the_way"] { background: #1a2a3a; color: #42a5f5; }
    .status-badge[data-status="arrived"] { background: #1a2a3a; color: #64b5f6; }
    .status-badge[data-status="in_progress"] { background: #1a2a3a; color: #42a5f5; }
    .status-badge[data-status="completed"] { background: #1a3a2a; color: #66bb6a; }
    .status-badge[data-status="cancelled"] { background: #3a1a1a; color: #ef5350; }
    .status-badge[data-status="rejected"] { background: #3a1a1a; color: #ef5350; }
    .booking-card__vendor {
      font-size: 13px;
      color: #888;
      margin: 0 0 6px;
    }
    .booking-card__meta {
      display: flex;
      gap: 8px;
      font-size: 12px;
      color: #666;
      margin-bottom: 6px;
    }
    .booking-card__price {
      font-size: 16px;
      font-weight: 800;
      color: #00bfa6;
    }

    .empty {
      text-align: center;
      padding: 48px 16px;
      color: #666;
    }
    .empty p {
      font-size: 15px;
      margin: 0 0 16px;
    }
    .cta-btn {
      display: inline-block;
      padding: 10px 24px;
      background: linear-gradient(90deg, #00bfa6, #00796b);
      color: #000;
      font-weight: 700;
      font-size: 14px;
      text-decoration: none;
      border-radius: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Skeleton */
    .skeleton { pointer-events: none; }
    .skeleton-line {
      height: 14px;
      background: #222;
      border-radius: 4px;
      margin-bottom: 8px;
      animation: shimmer 1.2s ease-in-out infinite;
    }
    .w70 { width: 70%; }
    .w50 { width: 50%; }
    .w30 { width: 30%; }
    @keyframes shimmer {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }
  `],
})
export class ActivityComponent implements OnInit {
  tabs = [
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
  ];
  activeTab = signal('ongoing');
  loadingBookings = signal(true);
  ongoingBookings = signal<any[]>([]);
  upcomingBookings = signal<any[]>([]);
  pastBookings = signal<any[]>([]);

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadBookings();
  }

  private loadBookings() {
    this.api.getBookings().subscribe({
      next: (res: any) => {
        const bookings = res.data || [];
        this.ongoingBookings.set(bookings.filter((b: any) => ['requested', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(b.status)));
        this.upcomingBookings.set(bookings.filter((b: any) => ['requested', 'accepted'].includes(b.status)));
        this.pastBookings.set(bookings.filter((b: any) => ['completed', 'cancelled', 'rejected'].includes(b.status)));
        this.loadingBookings.set(false);
      },
      error: () => this.loadingBookings.set(false),
    });
  }
}
