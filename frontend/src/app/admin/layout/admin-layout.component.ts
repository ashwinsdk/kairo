import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    template: `
    <div class="layout">
      <!-- Desktop sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <h1 class="brand">KAIRO</h1>
          <span class="brand-sub">Admin</span>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="sidebar-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Dashboard
          </a>
          <a routerLink="/admin/kyc" routerLinkActive="active" class="sidebar-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            KYC
          </a>
          <a routerLink="/admin/users" routerLinkActive="active" class="sidebar-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg>
            Users
          </a>
          <a routerLink="/admin/maintenance" routerLinkActive="active" class="sidebar-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            Settings
          </a>
        </nav>
      </aside>

      <!-- Main -->
      <main class="main">
        <!-- Mobile top nav -->
        <nav class="mobile-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="mnav-item">Dashboard</a>
          <a routerLink="/admin/kyc" routerLinkActive="active" class="mnav-item">KYC</a>
          <a routerLink="/admin/users" routerLinkActive="active" class="mnav-item">Users</a>
          <a routerLink="/admin/maintenance" routerLinkActive="active" class="mnav-item">Settings</a>
        </nav>
        <div class="main-content">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
    styles: [`
    .layout {
      min-height: 100vh;
      display: flex;
      background: #000;
    }
    .sidebar {
      width: 220px;
      background: #0a0a0a;
      border-right: 1px solid #222;
      padding: 20px 0;
      flex-shrink: 0;
      display: none;
    }
    @media (min-width: 768px) {
      .sidebar { display: block; }
    }
    .sidebar-brand {
      padding: 0 20px 20px;
      border-bottom: 1px solid #222;
      margin-bottom: 12px;
    }
    .brand {
      font-size: 20px;
      font-weight: 900;
      color: #fff;
      margin: 0;
      letter-spacing: 2px;
    }
    .brand-sub {
      font-size: 11px;
      color: #00bfa6;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 8px;
    }
    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 6px;
      color: #888;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      transition: all 200ms;
    }
    .sidebar-item:hover { background: #111; color: #ccc; }
    .sidebar-item.active { background: #1a1a1a; color: #00bfa6; }

    .main { flex: 1; min-width: 0; }
    .mobile-nav {
      display: flex;
      overflow-x: auto;
      gap: 0;
      border-bottom: 1px solid #222;
      background: #0a0a0a;
    }
    @media (min-width: 768px) {
      .mobile-nav { display: none; }
    }
    .mnav-item {
      flex-shrink: 0;
      padding: 12px 16px;
      color: #888;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid transparent;
      transition: all 200ms;
    }
    .mnav-item.active {
      color: #00bfa6;
      border-bottom-color: #00bfa6;
    }
    .main-content {
      padding: 16px;
      max-width: 960px;
    }
    @media (min-width: 768px) {
      .main-content { padding: 24px 32px; }
    }
  `],
})
export class AdminLayoutComponent { }
