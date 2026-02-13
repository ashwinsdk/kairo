import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="profile-page">
      <h1 class="page-title">Profile</h1>

      <!-- User Info -->
      <div class="user-card">
        <div class="user-avatar">{{ initials() }}</div>
        <div class="user-info">
          <h2 class="user-name">{{ user()?.name }}</h2>
          <p class="user-email">{{ user()?.email }}</p>
          <p class="user-phone">{{ user()?.phone || 'No phone added' }}</p>
        </div>
      </div>

      <!-- Menu -->
      <nav class="menu">
        <a routerLink="/home/addresses" class="menu-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>My Addresses</span>
          <svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
        <a routerLink="/home/notifications" class="menu-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span>Notifications</span>
          <svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
        <button class="menu-item" (click)="showHelp.set(true)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>Help & Support</span>
          <svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button class="menu-item" (click)="showAbout.set(true)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>About Kairo</span>
          <svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button class="menu-item menu-item--danger" (click)="showLogout.set(true)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span>Logout</span>
          <svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </nav>

      <!-- Logout Modal -->
      @if (showLogout()) {
        <div class="modal-overlay" (click)="showLogout.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal__title">We'll miss you!</h3>
            <p class="modal__text">Are you sure you want to logout?</p>
            <div class="modal__actions">
              <button class="btn btn--ghost" (click)="showLogout.set(false)">Stay</button>
              <button class="btn btn--danger" (click)="logout()">Logout</button>
            </div>
          </div>
        </div>
      }

      <!-- About Modal -->
      @if (showAbout()) {
        <div class="modal-overlay" (click)="showAbout.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal__title">About Kairo</h3>
            <p class="modal__text">Kairo is a hyperlocal services marketplace connecting you with trusted vendors in your neighbourhood.</p>
            <p class="modal__version">Version 1.0.0</p>
            <div class="modal__actions">
              <button class="btn btn--primary" (click)="showAbout.set(false)">Close</button>
            </div>
          </div>
        </div>
      }

      <!-- Help Modal -->
      @if (showHelp()) {
        <div class="modal-overlay" (click)="showHelp.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal__title">Help & Support</h3>
            <p class="modal__text">Need help? Email us at support&#64;kairo.local</p>
            <p class="modal__text">For emergencies, please contact your local authorities.</p>
            <div class="modal__actions">
              <button class="btn btn--primary" (click)="showHelp.set(false)">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    .profile-page { padding: 16px; }
    .page-title {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      margin: 0 0 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .user-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #111;
      border: 1px solid #222;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .user-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00bfa6, #00796b);
      color: #000;
      font-weight: 800;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .user-info { flex: 1; }
    .user-name {
      font-size: 18px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 2px;
    }
    .user-email {
      font-size: 13px;
      color: #888;
      margin: 0 0 2px;
    }
    .user-phone {
      font-size: 13px;
      color: #666;
      margin: 0;
    }

    /* Menu */
    .menu {
      display: flex;
      flex-direction: column;
      gap: 2px;
      background: #111;
      border: 1px solid #222;
      border-radius: 12px;
      overflow: hidden;
    }
    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: transparent;
      border: none;
      color: #ccc;
      font-size: 15px;
      font-family: inherit;
      text-decoration: none;
      cursor: pointer;
      transition: background 200ms;
      width: 100%;
      text-align: left;
    }
    .menu-item:hover { background: #1a1a1a; }
    .menu-item svg:first-child { color: #888; flex-shrink: 0; }
    .menu-item span { flex: 1; }
    .menu-arrow { color: #444; flex-shrink: 0; }
    .menu-item--danger { color: #ef5350; }
    .menu-item--danger svg:first-child { color: #ef5350; }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding: 16px;
      animation: fadeIn 200ms ease;
    }
    .modal {
      background: #111;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 24px;
      max-width: 340px;
      width: 100%;
      animation: scaleIn 200ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .modal__title {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
      margin: 0 0 8px;
    }
    .modal__text {
      font-size: 14px;
      color: #888;
      margin: 0 0 8px;
      line-height: 1.5;
    }
    .modal__version {
      font-size: 12px;
      color: #555;
      margin: 8px 0 0;
      font-family: 'Source Code Pro', monospace;
    }
    .modal__actions {
      display: flex;
      gap: 8px;
      margin-top: 20px;
    }
    .btn {
      flex: 1;
      padding: 10px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      border: none;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .btn--ghost {
      background: transparent;
      border: 1px solid #333;
      color: #ccc;
    }
    .btn--primary {
      background: linear-gradient(90deg, #00bfa6, #00796b);
      color: #000;
    }
    .btn--danger {
      background: #ef5350;
      color: #fff;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `],
})
export class ProfileComponent implements OnInit {
    user = signal<any>(null);
    initials = signal('');
    showLogout = signal(false);
    showAbout = signal(false);
    showHelp = signal(false);

    constructor(
        private authService: AuthService,
        private api: ApiService,
        private router: Router,
    ) { }

    ngOnInit() {
        const u = this.authService.currentUser;
        this.user.set(u);
        if (u?.name) {
            const parts = u.name.split(' ');
            this.initials.set((parts[0]?.[0] || '') + (parts[1]?.[0] || ''));
        }
    }

    logout() {
        this.authService.logout().subscribe({
            next: () => this.router.navigate(['/auth/login']),
            error: () => this.router.navigate(['/auth/login']),
        });
    }
}
