import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home">
      <!-- Header -->
      <header class="home__header">
        <div class="header-top">
          <div class="greeting">
            <p class="greeting__label">Hello,</p>
            <h1 class="greeting__name">{{ userName() }}</h1>
            <p class="greeting__location">📍 {{ locationName() }}</p>
          </div>
          <a routerLink="/home/notifications" class="notif-btn" aria-label="Notifications">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            @if (unreadCount() > 0) {
              <span class="notif-badge">{{ unreadCount() }}</span>
            }
          </a>
        </div>
      </header>

      <!-- Categories -->
      <section class="section">
        <h2 class="section__title">Services</h2>
        <div class="categories-grid">
          @for (cat of categories(); track cat.id) {
            <a [routerLink]="['/home/search']" [queryParams]="{category: cat.id}" class="category-card">
              <div class="category-card__icon" [innerHTML]="cat.icon"></div>
              <p class="category-card__name">{{ cat.name }}</p>
            </a>
          }
          @if (loadingCategories()) {
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="category-card skeleton">
                <div class="skeleton-circle"></div>
                <div class="skeleton-line"></div>
              </div>
            }
          }
        </div>
      </section>

      <!-- Promoted Vendors -->
      @if (promotedVendors().length > 0) {
        <section class="section">
          <h2 class="section__title">Featured</h2>
          <div class="promoted-scroll">
            @for (vendor of promotedVendors(); track vendor.id) {
              <a [routerLink]="['/home/vendor', vendor.id]" class="vendor-card vendor-card--promoted">
                <div class="vendor-card__avatar">{{ vendor.business_name?.charAt(0) || 'V' }}</div>
                <div class="vendor-card__info">
                  <h3 class="vendor-card__name">{{ vendor.business_name }}</h3>
                  <p class="vendor-card__category">{{ vendor.category_name }}</p>
                  <div class="vendor-card__meta">
                    <span class="rating"><svg class="star-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> {{ vendor.avg_rating || '—' }}</span>
                    <span class="dot">·</span>
                    <span class="jobs">{{ vendor.total_jobs || 0 }} jobs</span>
                  </div>
                </div>
                <span class="promoted-badge">PROMOTED</span>
              </a>
            }
          </div>
        </section>
      }

      <!-- Nearby Vendors -->
      <section class="section">
        <div class="section__header">
          <h2 class="section__title">Nearby Vendors</h2>
          <a routerLink="/home/search" class="section__link">View all</a>
        </div>
        @if (loadingVendors()) {
          @for (i of [1,2,3]; track i) {
            <div class="vendor-card skeleton">
              <div class="skeleton-circle skeleton-circle--lg"></div>
              <div class="skeleton-block">
                <div class="skeleton-line skeleton-line--md"></div>
                <div class="skeleton-line skeleton-line--sm"></div>
              </div>
            </div>
          }
        }
        @for (vendor of nearbyVendors(); track vendor.id) {
          <a [routerLink]="['/home/vendor', vendor.id]" class="vendor-card">
            <div class="vendor-card__avatar">{{ vendor.business_name?.charAt(0) || 'V' }}</div>
            <div class="vendor-card__info">
              <h3 class="vendor-card__name">{{ vendor.business_name }}</h3>
              <p class="vendor-card__category">{{ vendor.category_name }}</p>
              <div class="vendor-card__meta">
                <span class="rating"><svg class="star-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> {{ vendor.rating_avg?.toFixed(1) || '—' }}</span>
                <span class="dot">·</span>
                <span class="price">{{ vendor.rating_count || 0 }} reviews</span>
              </div>
            </div>
            <svg class="vendor-card__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        }
        @if (!loadingVendors() && nearbyVendors().length === 0) {
          <div class="empty-state">
            <p>No vendors found nearby. Try expanding your search.</p>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .home { padding: 16px; }
    .home__header { margin-bottom: 24px; }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .greeting__label {
      font-size: 14px;
      color: #888;
      margin: 0 0 2px;
    }
    .greeting__name {
      font-size: 24px;
      font-weight: 800;
      color: #fff;
      margin: 0;
    }
    .greeting__location {
      font-size: 13px;
      color: #00bfa6;
      margin: 4px 0 0 0;
      font-weight: 500;
    }
    .notif-btn {
      position: relative;
      padding: 8px;
      color: #fff;
      background: none;
      border: none;
      cursor: pointer;
    }
    .notif-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 18px;
      height: 18px;
      background: #00bfa6;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 700;
      color: #000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .section { margin-bottom: 28px; }
    .section__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .section__title {
      font-size: 18px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .section__header .section__title { margin-bottom: 0; }
    .section__link {
      font-size: 13px;
      color: #00bfa6;
      text-decoration: none;
      font-weight: 600;
    }

    /* Categories */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    @media (min-width: 480px) {
      .categories-grid { grid-template-columns: repeat(4, 1fr); }
    }
    .category-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 8px;
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
      text-decoration: none;
      transition: border-color 200ms, transform 120ms;
    }
    .category-card:active { transform: scale(0.96); }
    .category-card:hover { border-color: #00bfa6; }
    .category-card__icon { font-size: 28px; }
    .category-card__name {
      font-size: 12px;
      font-weight: 600;
      color: #ccc;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Promoted scroll */
    .promoted-scroll {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 4px;
    }
    .promoted-scroll::-webkit-scrollbar { display: none; }

    .vendor-card--promoted {
      min-width: 260px;
      scroll-snap-align: start;
      border: 1px solid #00bfa6;
      position: relative;
      padding-right: 76px; /* Make room for the badge */
    }
    .promoted-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: linear-gradient(90deg, #00bfa6, #00796b);
      color: #000;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 1px;
    }

    /* Vendor cards */
    .vendor-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
      text-decoration: none;
      margin-bottom: 8px;
      transition: border-color 200ms;
    }
    .vendor-card:hover { border-color: #333; }
    .vendor-card__avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00bfa6, #00796b);
      color: #000;
      font-weight: 800;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .vendor-card__info { flex: 1; min-width: 0; }
    .vendor-card__name {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .vendor-card__category {
      font-size: 12px;
      color: #888;
      margin: 0 0 4px;
    }
    .vendor-card__meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #aaa;
    }
    .rating { color: #ffc107; font-weight: 600; }
    .dot { color: #444; }
    .vendor-card__arrow { color: #555; flex-shrink: 0; }

    .empty-state {
      text-align: center;
      padding: 32px 16px;
      color: #666;
      font-size: 14px;
    }

    /* Skeleton */
    .skeleton { pointer-events: none; }
    .skeleton-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #222;
      animation: shimmer 1.2s ease-in-out infinite;
    }
    .skeleton-circle--lg { width: 48px; height: 48px; }
    .skeleton-block { flex: 1; }
    .skeleton-line {
      height: 12px;
      background: #222;
      border-radius: 4px;
      margin-bottom: 6px;
      animation: shimmer 1.2s ease-in-out infinite;
    }
    .skeleton-line--md { width: 60%; }
    .skeleton-line--sm { width: 40%; }
    @keyframes shimmer {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }
  `],
})
export class HomeComponent implements OnInit {
  userName = signal('');
  locationName = signal('Locating...');
  categories = signal<any[]>([]);
  promotedVendors = signal<any[]>([]);
  nearbyVendors = signal<any[]>([]);
  unreadCount = signal(0);
  loadingCategories = signal(true);
  loadingVendors = signal(true);
  userLocation = signal<{ lat: number; lng: number } | null>(null);

  private sanitizer = inject(DomSanitizer);

  private categoryIcons: Record<string, string> = {
    'Plumbing': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    'Electrical': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    'Cleaning': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>',
    'Carpentry': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/></svg>',
    'Painting': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/></svg>',
    'Appliance Repair': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
    'Pest Control': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>',
    'Gardening': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s1 5.5-3 11.5"/><path d="M12 22v-8.3"/></svg>',
    'AC Service': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h10M9 4v16M3 9l3 3-3 3"/><path d="M20 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>',
    'Shifting & Moving': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
  };

  private defaultIcon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) { }

  ngOnInit() {
    const user = this.auth.currentUser;
    this.userName.set(user?.name?.split(' ')[0] || 'there');

    this.loadCategories();
    this.loadPromoted();
    this.requestLocation();
    this.loadNotifications();
  }

  private requestLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.userLocation.set(loc);
          this.loadNearbyVendors();

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
          // Load vendors without location filter
          this.loadNearbyVendors();
        }
      );
    } else {
      // Geolocation not supported
      this.locationName.set('Location unavailable');
      this.loadNearbyVendors();
    }
  }

  private loadCategories() {
    this.api.getCategories().subscribe({
      next: (res: any) => {
        const cats = (res.data || []).map((c: any) => ({
          ...c,
          icon: this.sanitizer.bypassSecurityTrustHtml(
            this.categoryIcons[c.name] || this.defaultIcon
          ),
        }));
        this.categories.set(cats);
        this.loadingCategories.set(false);
      },
      error: () => this.loadingCategories.set(false),
    });
  }

  private loadPromoted() {
    this.api.getPromotedVendors().subscribe({
      next: (res: any) => {
        this.promotedVendors.set(res.data || []);
      },
    });
  }

  private loadNearbyVendors() {
    const loc = this.userLocation();
    const params = loc ? { lat: loc.lat, lng: loc.lng, limit: 10 } : { limit: 10 };

    this.api.getVendors(params).subscribe({
      next: (res: any) => {
        this.nearbyVendors.set(res.data || []);
        this.loadingVendors.set(false);
      },
      error: () => this.loadingVendors.set(false),
    });
  }

  private loadNotifications() {
    this.api.getNotifications().subscribe({
      next: (res: any) => {
        this.unreadCount.set(res.meta?.unread_count || 0);
      },
    });
  }
}
