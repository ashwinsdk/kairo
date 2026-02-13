import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-vendor-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    template: `
    <div class="layout">
      <main class="layout__content">
        <router-outlet />
      </main>
      <nav class="bottom-nav">
        <a routerLink="/vendor/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span>Dashboard</span>
        </a>
        <a routerLink="/vendor/bookings" routerLinkActive="active" class="nav-item">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>Bookings</span>
        </a>
        <a routerLink="/vendor/earnings" routerLinkActive="active" class="nav-item">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span>Earnings</span>
        </a>
        <a routerLink="/vendor/profile" routerLinkActive="active" class="nav-item">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Profile</span>
        </a>
      </nav>
    </div>
  `,
    styles: [`
    .layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #000;
    }
    .layout__content {
      flex: 1;
      padding-bottom: 72px;
      overflow-y: auto;
    }
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: #0a0a0a;
      border-top: 1px solid #222;
      display: flex;
      align-items: center;
      justify-content: space-around;
      z-index: 100;
      padding-bottom: env(safe-area-inset-bottom);
    }
    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      text-decoration: none;
      color: #555;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: color 200ms;
      padding: 8px 12px;
    }
    .nav-item.active { color: #00bfa6; }
    .nav-item svg { width: 22px; height: 22px; }
    @media (min-width: 768px) {
      .bottom-nav {
        max-width: 480px;
        left: 50%;
        transform: translateX(-50%);
        border-radius: 12px 12px 0 0;
      }
    }
  `],
})
export class VendorLayoutComponent { }
