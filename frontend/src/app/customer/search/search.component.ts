import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
    selector: 'app-search',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    template: `
    <div class="search-page">
      <header class="search-header">
        <h1 class="page-title">Find Services</h1>
        <div class="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            placeholder="Search vendors, services..."
            class="search-input"
          />
          @if (searchQuery) {
            <button (click)="clearSearch()" class="clear-btn" aria-label="Clear">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          }
        </div>
      </header>

      <!-- Category Filters -->
      <div class="filters">
        <button
          class="filter-chip"
          [class.active]="!selectedCategory()"
          (click)="selectCategory(null)"
        >All</button>
        @for (cat of categories(); track cat.id) {
          <button
            class="filter-chip"
            [class.active]="selectedCategory() === cat.id"
            (click)="selectCategory(cat.id)"
          >{{ cat.name }}</button>
        }
      </div>

      <!-- Sort -->
      <div class="sort-row">
        <span class="results-count">{{ vendors().length }} vendors found</span>
        <select [(ngModel)]="sortBy" (change)="loadVendors()" class="sort-select">
          <option value="">Relevance</option>
          <option value="rating">Top Rated</option>
          <option value="price_low">Price: Low</option>
          <option value="price_high">Price: High</option>
        </select>
      </div>

      <!-- Vendor List -->
      @if (loading()) {
        @for (i of [1,2,3,4,5]; track i) {
          <div class="vendor-card skeleton">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-body">
              <div class="skeleton-line w60"></div>
              <div class="skeleton-line w40"></div>
              <div class="skeleton-line w80"></div>
            </div>
          </div>
        }
      }

      @for (vendor of vendors(); track vendor.id) {
        <a [routerLink]="['/home/vendor', vendor.id]" class="vendor-card">
          <div class="vendor-avatar">{{ vendor.business_name?.charAt(0) || 'V' }}</div>
          <div class="vendor-info">
            <h3 class="vendor-name">{{ vendor.business_name }}</h3>
            <p class="vendor-category">{{ vendor.category_name }}</p>
            <div class="vendor-meta">
              <span class="rating"><svg class="star-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> {{ vendor.avg_rating || '—' }}</span>
              <span class="divider">·</span>
              <span>{{ vendor.total_jobs || 0 }} jobs</span>
              <span class="divider">·</span>
              <span class="price">₹{{ vendor.base_price || '—' }}</span>
            </div>
            @if (vendor.services && vendor.services.length > 0) {
              <div class="vendor-services">
                @for (svc of vendor.services.slice(0, 3); track svc) {
                  <span class="service-tag">{{ svc }}</span>
                }
              </div>
            }
          </div>
          <svg class="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
      }

      @if (!loading() && vendors().length === 0) {
        <div class="empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p>No vendors found</p>
          <span>Try a different search or category</span>
        </div>
      }
    </div>
  `,
    styles: [`
    .search-page { padding: 16px; }
    .page-title {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      margin: 0 0 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #111;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 16px;
      transition: border-color 200ms;
    }
    .search-box:focus-within { border-color: #00bfa6; }
    .search-box svg { color: #666; flex-shrink: 0; }
    .search-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: #fff;
      font-size: 15px;
      font-family: inherit;
    }
    .search-input::placeholder { color: #555; }
    .clear-btn {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 2px;
    }

    /* Filters */
    .filters {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 12px;
      -webkit-overflow-scrolling: touch;
    }
    .filters::-webkit-scrollbar { display: none; }
    .filter-chip {
      flex-shrink: 0;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid #333;
      background: transparent;
      color: #aaa;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 200ms;
      font-family: inherit;
    }
    .filter-chip.active {
      background: linear-gradient(90deg, #00bfa6, #00796b);
      color: #000;
      border-color: transparent;
    }

    /* Sort */
    .sort-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .results-count { font-size: 13px; color: #666; }
    .sort-select {
      background: #111;
      color: #ccc;
      border: 1px solid #333;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 12px;
      font-family: inherit;
      outline: none;
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
    .vendor-avatar {
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
    .vendor-info { flex: 1; min-width: 0; }
    .vendor-name {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 2px;
    }
    .vendor-category {
      font-size: 12px;
      color: #888;
      margin: 0 0 4px;
    }
    .vendor-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #aaa;
    }
    .rating { color: #ffc107; font-weight: 600; }
    .divider { color: #444; }
    .price { color: #00bfa6; font-weight: 600; }
    .vendor-services {
      display: flex;
      gap: 4px;
      margin-top: 6px;
      flex-wrap: wrap;
    }
    .service-tag {
      font-size: 10px;
      padding: 2px 6px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 4px;
      color: #888;
    }
    .arrow { color: #555; flex-shrink: 0; }

    .empty {
      text-align: center;
      padding: 48px 16px;
      color: #666;
    }
    .empty p {
      margin: 16px 0 4px;
      font-size: 16px;
      font-weight: 600;
      color: #888;
    }
    .empty span { font-size: 13px; }

    /* Skeleton */
    .skeleton { pointer-events: none; }
    .skeleton-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #222;
      animation: shimmer 1.2s ease-in-out infinite;
    }
    .skeleton-body { flex: 1; }
    .skeleton-line {
      height: 12px;
      background: #222;
      border-radius: 4px;
      margin-bottom: 6px;
      animation: shimmer 1.2s ease-in-out infinite;
    }
    .w60 { width: 60%; }
    .w40 { width: 40%; }
    .w80 { width: 80%; }
    @keyframes shimmer {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }
  `],
})
export class SearchComponent implements OnInit {
    searchQuery = '';
    sortBy = '';
    categories = signal<any[]>([]);
    vendors = signal<any[]>([]);
    selectedCategory = signal<number | null>(null);
    loading = signal(true);

    private searchTimeout: any;

    constructor(
        private api: ApiService,
        private route: ActivatedRoute,
    ) { }

    ngOnInit() {
        this.api.getCategories().subscribe({
            next: (res: any) => this.categories.set(res.data || []),
        });

        this.route.queryParams.subscribe(params => {
            if (params['category']) {
                this.selectedCategory.set(+params['category']);
            }
            this.loadVendors();
        });
    }

    selectCategory(id: number | null) {
        this.selectedCategory.set(id);
        this.loadVendors();
    }

    onSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => this.loadVendors(), 300);
    }

    clearSearch() {
        this.searchQuery = '';
        this.loadVendors();
    }

    loadVendors() {
        this.loading.set(true);
        const params: any = {};
        if (this.selectedCategory()) params.category = this.selectedCategory();
        if (this.searchQuery) params.search = this.searchQuery;
        if (this.sortBy) params.sort = this.sortBy;

        this.api.getVendors(params).subscribe({
            next: (res: any) => {
                this.vendors.set(res.data || []);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }
}
