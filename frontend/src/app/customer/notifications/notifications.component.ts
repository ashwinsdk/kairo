import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="notifications-page">
      <button class="back-btn" (click)="goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      <div class="header-row">
        <h1 class="page-title">Notifications</h1>
        @if (unreadCount() > 0) {
          <button class="mark-all-btn" (click)="markAllRead()">Mark all read</button>
        }
      </div>

      @if (loading()) {
        @for (i of [1,2,3,4]; track i) {
          <div class="notif-card skeleton">
            <div class="skeleton-line w80"></div>
            <div class="skeleton-line w60"></div>
          </div>
        }
      }

      @for (notif of notifications(); track notif.id) {
        <div
          class="notif-card"
          [class.unread]="!notif.read_at"
          (click)="markRead(notif)"
        >
          <div class="notif-icon" [attr.data-type]="notif.type">
            @switch (notif.type) {
              @case ('booking') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              }
              @case ('payment') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              }
              @case ('chat') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              }
              @default {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              }
            }
          </div>
          <div class="notif-content">
            <p class="notif-title">{{ notif.title }}</p>
            <p class="notif-message">{{ notif.message }}</p>
            <span class="notif-time">{{ notif.created_at | date:'short' }}</span>
          </div>
          @if (!notif.read_at) {
            <div class="unread-dot"></div>
          }
        </div>
      }

      @if (!loading() && notifications().length === 0) {
        <div class="empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <p>No notifications</p>
        </div>
      }
    </div>
  `,
    styles: [`
    .notifications-page { padding: 16px; }
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
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .page-title {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .mark-all-btn {
      padding: 6px 12px;
      background: transparent;
      border: 1px solid #333;
      border-radius: 6px;
      color: #00bfa6;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }

    .notif-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px;
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
      margin-bottom: 6px;
      cursor: pointer;
      transition: border-color 200ms;
      position: relative;
    }
    .notif-card:hover { border-color: #333; }
    .notif-card.unread {
      background: #0a1a15;
      border-color: #1a3a2a;
    }

    .notif-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: #1a1a1a;
      color: #888;
    }
    .notif-icon[data-type="booking"] { background: #1a2a1a; color: #00bfa6; }
    .notif-icon[data-type="payment"] { background: #2a2a1a; color: #ffc107; }
    .notif-icon[data-type="chat"] { background: #1a1a2a; color: #42a5f5; }

    .notif-content { flex: 1; min-width: 0; }
    .notif-title {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 2px;
    }
    .notif-message {
      font-size: 13px;
      color: #888;
      margin: 0 0 4px;
      line-height: 1.4;
    }
    .notif-time {
      font-size: 11px;
      color: #555;
      font-family: 'Source Code Pro', monospace;
    }
    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #00bfa6;
      flex-shrink: 0;
      margin-top: 4px;
    }

    .empty {
      text-align: center;
      padding: 64px 16px;
      color: #555;
    }
    .empty p {
      font-size: 15px;
      margin: 16px 0 0;
    }

    .skeleton { pointer-events: none; }
    .skeleton-line {
      height: 14px;
      background: #222;
      border-radius: 4px;
      margin-bottom: 6px;
      animation: shimmer 1.2s ease-in-out infinite;
    }
    .w80 { width: 80%; }
    .w60 { width: 60%; }
    @keyframes shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
  `],
})
export class NotificationsComponent implements OnInit {
    notifications = signal<any[]>([]);
    unreadCount = signal(0);
    loading = signal(true);

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.loadNotifications();
    }

    private loadNotifications() {
        this.api.getNotifications().subscribe({
            next: (res: any) => {
                this.notifications.set(res.data || []);
                this.unreadCount.set(res.meta?.unread_count || 0);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    markRead(notif: any) {
        if (notif.read_at) return;
        this.api.markNotificationRead(notif.id).subscribe({
            next: () => {
                notif.read_at = new Date().toISOString();
                this.unreadCount.update(c => Math.max(0, c - 1));
            },
        });
    }

    markAllRead() {
        this.api.markAllNotificationsRead().subscribe({
            next: () => {
                this.notifications.update(notifs =>
                    notifs.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
                );
                this.unreadCount.set(0);
            },
        });
    }

    goBack() {
        history.back();
    }
}
