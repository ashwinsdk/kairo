import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-vendor-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="vendor-detail">
      <!-- Back button -->
      <button class="back-btn" (click)="goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      @if (loading()) {
        <div class="skeleton-header">
          <div class="skeleton-circle-lg"></div>
          <div class="skeleton-block">
            <div class="skeleton-line w70"></div>
            <div class="skeleton-line w50"></div>
          </div>
        </div>
      }

      @if (vendor()) {
        <!-- Vendor Header -->
        <div class="vendor-header">
          <div class="vendor-avatar">{{ vendor().business_name?.charAt(0) || 'V' }}</div>
          <div class="vendor-meta">
            <h1 class="vendor-name">{{ vendor().business_name }}</h1>
            <p class="vendor-category">{{ vendor().category_name }}</p>
            <div class="vendor-stats">
              <span class="stat">
                <span class="stat__value"><svg class="star-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> {{ vendor().avg_rating || '—' }}</span>
                <span class="stat__label">Rating</span>
              </span>
              <span class="stat-divider"></span>
              <span class="stat">
                <span class="stat__value">{{ vendor().total_jobs || 0 }}</span>
                <span class="stat__label">Jobs</span>
              </span>
              <span class="stat-divider"></span>
              <span class="stat">
                <span class="stat__value">{{ vendor().experience_years || 0 }}y</span>
                <span class="stat__label">Experience</span>
              </span>
            </div>
          </div>
        </div>

        @if (vendor().bio) {
          <div class="section">
            <h3 class="section-title">About</h3>
            <p class="bio">{{ vendor().bio }}</p>
          </div>
        }

        <!-- Services -->
        <div class="section">
          <h3 class="section-title">Services</h3>
          @for (svc of vendor().services || []; track svc.id) {
            <div class="service-card">
              <div class="service-info">
                <h4 class="service-name">{{ svc.service_name }}</h4>
                <p class="service-desc">{{ svc.description }}</p>
              </div>
              <div class="service-action">
                <span class="service-price">₹{{ svc.base_price }}</span>
                <a [routerLink]="['/home/book', vendor().id, svc.id]" class="book-btn">Book</a>
              </div>
            </div>
          }
          @if (!vendor().services || vendor().services.length === 0) {
            <p class="no-data">No services listed</p>
          }
        </div>

        <!-- Reviews -->
        <div class="section">
          <h3 class="section-title">Reviews</h3>
          @for (review of vendor().reviews || []; track review.id) {
            <div class="review-card">
              <div class="review-header">
                <span class="review-author">{{ review.customer_name || 'Customer' }}</span>
                <span class="review-rating"><svg class="star-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> {{ review.rating }}</span>
              </div>
              @if (review.comment) {
                <p class="review-text">{{ review.comment }}</p>
              }
              <span class="review-date">{{ review.created_at | date:'mediumDate' }}</span>
            </div>
          }
          @if (!vendor().reviews || vendor().reviews.length === 0) {
            <p class="no-data">No reviews yet</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .vendor-detail { padding: 16px; }
    .back-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      color: #888;
      font-size: 14px;
      font-family: inherit;
      cursor: pointer;
      padding: 0;
      margin-bottom: 16px;
    }
    .back-btn:hover { color: #00bfa6; }

    .vendor-header {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 24px;
      padding: 20px;
      background: #111;
      border: 1px solid #222;
      border-radius: 12px;
    }
    .vendor-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00bfa6, #00796b);
      color: #000;
      font-weight: 800;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .vendor-meta { flex: 1; }
    .vendor-name {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      margin: 0 0 4px;
    }
    .vendor-category {
      font-size: 13px;
      color: #888;
      margin: 0 0 12px;
    }
    .vendor-stats {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .stat { text-align: center; }
    .stat__value {
      display: block;
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }
    .stat__label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-divider {
      width: 1px;
      height: 24px;
      background: #333;
    }

    .section { margin-bottom: 24px; }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #888;
      margin: 0 0 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .bio {
      font-size: 14px;
      color: #aaa;
      line-height: 1.6;
      margin: 0;
    }

    /* Service card */
    .service-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px;
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .service-info { flex: 1; min-width: 0; margin-right: 12px; }
    .service-name {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 2px;
    }
    .service-desc {
      font-size: 12px;
      color: #666;
      margin: 0;
    }
    .service-action {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }
    .service-price {
      font-size: 16px;
      font-weight: 800;
      color: #00bfa6;
    }
    .book-btn {
      padding: 6px 16px;
      background: linear-gradient(90deg, #00bfa6, #00796b);
      color: #000;
      font-size: 12px;
      font-weight: 700;
      border-radius: 6px;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: transform 120ms;
    }
    .book-btn:active { transform: scale(0.96); }

    /* Reviews */
    .review-card {
      padding: 14px;
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .review-author {
      font-size: 14px;
      font-weight: 600;
      color: #ccc;
    }
    .review-rating {
      font-size: 13px;
      color: #ffc107;
      font-weight: 700;
    }
    .review-text {
      font-size: 13px;
      color: #888;
      line-height: 1.5;
      margin: 0 0 6px;
    }
    .review-date {
      font-size: 11px;
      color: #555;
    }
    .no-data {
      color: #555;
      font-size: 13px;
      font-style: italic;
      margin: 0;
    }

    /* Skeleton */
    .skeleton-header {
      display: flex;
      gap: 16px;
      padding: 20px;
      background: #111;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .skeleton-circle-lg {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #222;
      animation: shimmer 1.2s ease-in-out infinite;
    }
    .skeleton-block { flex: 1; }
    .skeleton-line {
      height: 14px;
      background: #222;
      border-radius: 4px;
      margin-bottom: 8px;
      animation: shimmer 1.2s ease-in-out infinite;
    }
    .w70 { width: 70%; }
    .w50 { width: 50%; }
    @keyframes shimmer {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }
  `],
})
export class VendorDetailComponent implements OnInit {
  vendor = signal<any>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private router: Router,
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.getVendorDetail(id).subscribe({
        next: (res: any) => {
          this.vendor.set(res.data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
    }
  }

  goBack() {
    history.back();
  }
}
