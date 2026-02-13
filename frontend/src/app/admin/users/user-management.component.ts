import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="users-page">
      <h1 class="page-title">User Management</h1>

      <!-- Search / Filter -->
      <div class="controls">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" [(ngModel)]="searchQuery" (input)="search()" placeholder="Search users..." class="search-input" />
        </div>
        <select [(ngModel)]="roleFilter" (change)="loadUsers()" class="filter-select">
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="vendor">Vendors</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      @if (loading()) {
        @for (i of [1,2,3,4,5]; track i) {
          <div class="user-card skeleton">
            <div class="skeleton-line w80"></div>
            <div class="skeleton-line w60"></div>
          </div>
        }
      }

      @for (user of users(); track user.id) {
        <div class="user-card" [class.blocked]="user.is_blocked">
          <div class="user-info">
            <div class="user-avatar">{{ user.name?.charAt(0) || '?' }}</div>
            <div class="user-details">
              <h3 class="user-name">{{ user.name }}</h3>
              <p class="user-email">{{ user.email }}</p>
              <div class="user-meta">
                <span class="role-badge" [attr.data-role]="user.role">{{ user.role }}</span>
                @if (user.is_blocked) {
                  <span class="blocked-badge">BLOCKED</span>
                }
              </div>
            </div>
          </div>
          <div class="user-actions">
            @if (user.role !== 'admin') {
              <button
                class="action-btn"
                [class.unblock]="user.is_blocked"
                (click)="toggleBlock(user)"
              >{{ user.is_blocked ? 'Unblock' : 'Block' }}</button>
            }
          </div>
        </div>
      }

      @if (!loading() && users().length === 0) {
        <div class="empty"><p>No users found</p></div>
      }
    </div>
  `,
    styles: [`
    .users-page { }
    .page-title {
      font-size: 24px; font-weight: 800; color: #fff;
      margin: 0 0 20px; text-transform: uppercase; letter-spacing: 1px;
    }
    .controls {
      display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;
    }
    .search-box {
      flex: 1; min-width: 200px; display: flex; align-items: center; gap: 8px;
      background: #111; border: 1px solid #333; border-radius: 8px; padding: 8px 12px;
    }
    .search-box:focus-within { border-color: #00bfa6; }
    .search-box svg { color: #666; }
    .search-input {
      flex: 1; background: none; border: none; outline: none;
      color: #fff; font-size: 14px; font-family: inherit;
    }
    .search-input::placeholder { color: #555; }
    .filter-select {
      padding: 8px 12px; background: #111; border: 1px solid #333;
      border-radius: 8px; color: #ccc; font-size: 14px; font-family: inherit; outline: none;
    }

    .user-card {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px; background: #111; border: 1px solid #222;
      border-radius: 8px; margin-bottom: 6px; transition: border-color 200ms;
    }
    .user-card.blocked { border-color: #3a1a1a; opacity: 0.7; }
    .user-info { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
    .user-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #00bfa6, #00796b);
      color: #000; font-weight: 800; font-size: 16px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .user-details { min-width: 0; }
    .user-name { font-size: 15px; font-weight: 700; color: #fff; margin: 0 0 2px; }
    .user-email { font-size: 12px; color: #666; margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; }
    .user-meta { display: flex; gap: 6px; align-items: center; }
    .role-badge {
      font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .role-badge[data-role="admin"] { background: #2a1a2a; color: #ce93d8; }
    .role-badge[data-role="vendor"] { background: #1a2a1a; color: #00bfa6; }
    .role-badge[data-role="customer"] { background: #1a1a2a; color: #42a5f5; }
    .blocked-badge {
      font-size: 9px; font-weight: 700; color: #ef5350;
      letter-spacing: 0.5px;
    }
    .user-actions { flex-shrink: 0; }
    .action-btn {
      padding: 6px 12px; border-radius: 6px; font-size: 12px;
      font-weight: 700; cursor: pointer; font-family: inherit;
      text-transform: uppercase; letter-spacing: 0.5px;
      background: transparent; border: 1px solid #ef5350; color: #ef5350;
      transition: all 200ms;
    }
    .action-btn.unblock { border-color: #00bfa6; color: #00bfa6; }
    .empty { text-align: center; padding: 32px; color: #555; }
    .empty p { margin: 0; font-size: 14px; }
    .skeleton { pointer-events: none; }
    .skeleton-line { height: 14px; background: #222; border-radius: 4px; margin-bottom: 8px; animation: shimmer 1.2s ease-in-out infinite; }
    .w80 { width: 80%; }
    .w60 { width: 60%; }
    @keyframes shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
  `],
})
export class UserManagementComponent implements OnInit {
    users = signal<any[]>([]);
    loading = signal(true);
    searchQuery = '';
    roleFilter = '';
    private searchTimeout: any;

    constructor(
        private api: ApiService,
        private toast: ToastService,
    ) { }

    ngOnInit() {
        this.loadUsers();
    }

    search() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => this.loadUsers(), 300);
    }

    loadUsers() {
        this.loading.set(true);
        const params: any = {};
        if (this.searchQuery) params.search = this.searchQuery;
        if (this.roleFilter) params.role = this.roleFilter;

        this.api.getUsers(params).subscribe({
            next: (res: any) => {
                this.users.set(res.data || []);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    toggleBlock(user: any) {
        this.api.blockUser(user.id, !user.is_blocked).subscribe({
            next: () => {
                this.toast.show(user.is_blocked ? 'User unblocked' : 'User blocked', 'success');
                this.loadUsers();
            },
            error: (err: any) => this.toast.show(err.error?.message || 'Failed', 'error'),
        });
    }
}
