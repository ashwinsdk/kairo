import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <div>
          <p class="greeting">Hello,</p>
          <h1 class="name">{{ vendorName() }}</h1>
          <p class="location">📍 {{ locationName() }}</p>
        </div>
        <!-- Online/Offline Toggle -->
        <button
          class="status-toggle"
          [class.online]="isOnline()"
          (click)="toggleOnline()"
        >
          <span class="toggle-track">
            <span class="toggle-thumb"></span>
          </span>
          <span class="toggle-label">{{ isOnline() ? 'Online' : 'Offline' }}</span>
        </button>
      </header>

      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-value">{{ todayJobs() }}</span>
          <span class="kpi-label">Today</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-value">{{ pendingJobs() }}</span>
          <span class="kpi-label">Pending</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-value">₹{{ weekEarnings() }}</span>
          <span class="kpi-label">This Week</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-value"><svg class="star-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> {{ avgRating() }}</span>
          <span class="kpi-label">Rating</span>
        </div>
      </div>

      <!-- Pending Requests -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Pending Requests</h2>
          <a routerLink="/vendor/bookings" class="section-link">View all</a>
        </div>

        @if (loadingBookings()) {
          @for (i of [1,2]; track i) {
            <div class="request-card skeleton">
              <div class="skeleton-line w70"></div>
              <div class="skeleton-line w50"></div>
            </div>
          }
        }

        @for (booking of pendingBookings(); track booking.id) {
          <a [routerLink]="['/vendor/job', booking.id]" class="request-card">
            <div class="request-top">
              <span class="request-service">{{ booking.service_name }}</span>
              <span class="request-price">₹{{ booking.estimated_price }}</span>
            </div>
            <p class="request-customer">{{ booking.customer_name }}</p>
            <div class="request-meta">
              <span>{{ booking.scheduled_date | date:'mediumDate' }}</span>
              <span>{{ booking.scheduled_time }}</span>
            </div>
          </a>
        }

        @if (!loadingBookings() && pendingBookings().length === 0) {
          <div class="empty">
            <p>No pending requests</p>
          </div>
        }
      </section>

      <!-- Active Jobs -->
      <section class="section">
        <h2 class="section-title">Active Jobs</h2>
        @for (booking of activeBookings(); track booking.id) {
          <a [routerLink]="['/vendor/job', booking.id]" class="request-card request-card--active">
            <div class="request-top">
              <span class="request-service">{{ booking.service_name }}</span>
              <span class="status-badge" [attr.data-status]="booking.status">{{ booking.status | titlecase }}</span>
            </div>
            <p class="request-customer">{{ booking.customer_name }}</p>
            <div class="request-meta">
              <span>{{ booking.scheduled_date | date:'mediumDate' }}</span>
              <span>{{ booking.scheduled_time }}</span>
            </div>
          </a>
        }
        @if (!loadingBookings() && activeBookings().length === 0) {
          <div class="empty"><p>No active jobs</p></div>
        }
      </section>
    </div>
  `,
  styles: [`
    .dashboard { padding: 16px; }
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .greeting { font-size: 14px; color: #888; margin: 0 0 2px; }
    .name { font-size: 24px; font-weight: 800; color: #fff; margin: 0; }
    .location { font-size: 13px; color: #00bfa6; margin: 4px 0 0 0; font-weight: 500; }

    /* Toggle */
    .status-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
    }
    .toggle-track {
      width: 44px;
      height: 24px;
      border-radius: 12px;
      background: #333;
      position: relative;
      transition: background 200ms;
    }
    .status-toggle.online .toggle-track { background: #00bfa6; }
    .toggle-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: transform 200ms;
    }
    .status-toggle.online .toggle-thumb { transform: translateX(20px); }
    .toggle-label {
      font-size: 12px;
      font-weight: 700;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-toggle.online .toggle-label { color: #00bfa6; }

    /* KPIs */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 24px;
    }
    .kpi-card {
      padding: 16px;
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
      text-align: center;
    }
    .kpi-value {
      display: block;
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 4px;
      font-family: 'Source Code Pro', monospace;
    }
    .kpi-label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Sections */
    .section { margin-bottom: 24px; }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .section-link {
      font-size: 13px;
      color: #00bfa6;
      text-decoration: none;
      font-weight: 600;
    }

    .request-card {
      display: block;
      padding: 14px;
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
      text-decoration: none;
      margin-bottom: 8px;
      transition: border-color 200ms;
    }
    .request-card:hover { border-color: #333; }
    .request-card--active { border-color: #1a3a2a; }
    .request-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .request-service {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }
    .request-price {
      font-size: 16px;
      font-weight: 800;
      color: #00bfa6;
    }
    .request-customer {
      font-size: 13px;
      color: #888;
      margin: 0 0 6px;
    }
    .request-meta {
      display: flex;
      gap: 8px;
      font-size: 12px;
      color: #666;
    }
    .status-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .status-badge[data-status="accepted"] { background: #1a3a2a; color: #00bfa6; }
    .status-badge[data-status="in_progress"] { background: #1a2a3a; color: #42a5f5; }

    .empty {
      text-align: center;
      padding: 24px;
      color: #555;
      font-size: 14px;
    }
    .empty p { margin: 0; }

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
    @keyframes shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
  `],
})
export class VendorDashboardComponent implements OnInit {
  vendorName = signal('');
  locationName = signal('Locating...');
  isOnline = signal(true);
  todayJobs = signal(0);
  pendingJobs = signal(0);
  weekEarnings = signal(0);
  avgRating = signal('—');
  pendingBookings = signal<any[]>([]);
  activeBookings = signal<any[]>([]);
  loadingBookings = signal(true);

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) { }

  ngOnInit() {
    const user = this.auth.currentUser;
    this.vendorName.set(user?.name?.split(' ')[0] || 'there');

    this.requestLocation();
    this.loadEarnings();
    this.loadBookings();
  }

  private requestLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // Update user location in backend
          this.api.updateLocation(loc.lat, loc.lng).subscribe();

          // Reverse geocode to get location name
          this.api.reverseGeocode(loc.lat, loc.lng).subscribe({
            next: (res: any) => {
              const addr = res.data?.address;
              const locationText = addr?.city || addr?.town || addr?.village || addr?.suburb || 'Unknown';
              this.locationName.set(locationText);
            },
            error: () => this.locationName.set('Location unknown')
          });
        },
        (error) => {
          console.warn('Geolocation denied or unavailable:', error);
          this.locationName.set('Location unavailable');
        }
      );
    } else {
      // Geolocation not supported
      this.locationName.set('Location unavailable');
    }
  }

  toggleOnline() {
    this.isOnline.update(v => !v);
  }

  private loadEarnings() {
    this.api.getEarnings().subscribe({
      next: (res: any) => {
        this.weekEarnings.set(res.data?.this_week || 0);
        this.todayJobs.set(res.data?.today_completed || 0);
        this.avgRating.set(res.data?.avg_rating || '—');
      },
    });
  }

  private loadBookings() {
    this.api.getBookings().subscribe({
      next: (res: any) => {
        const bookings = res.data || [];
        this.pendingBookings.set(bookings.filter((b: any) => b.status === 'requested'));
        this.activeBookings.set(bookings.filter((b: any) => ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(b.status)));
        this.pendingJobs.set(this.pendingBookings().length);
        this.loadingBookings.set(false);
      },
      error: () => this.loadingBookings.set(false),
    });
  }
}
