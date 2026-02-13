import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <img src="/kairo.png" alt="Kairo Logo" class="logo-mark" />
          <h1 class="auth-title">KAIRO</h1>
          <p class="auth-subtitle">Create your account</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="field">
            <label for="name" class="field__label">Full Name</label>
            <input id="name" type="text" [(ngModel)]="name" name="name" class="field__input" placeholder="Your name" required />
          </div>
          <div class="field">
            <label for="email" class="field__label">Email</label>
            <input id="email" type="email" [(ngModel)]="email" name="email" class="field__input" placeholder="you&#64;example.com" required />
          </div>
          <div class="field">
            <label for="password" class="field__label">Password</label>
            <input id="password" type="password" [(ngModel)]="password" name="password" class="field__input" placeholder="Min. 8 characters" required />
          </div>

          <div class="role-toggle">
            <button type="button" class="role-btn" [class.active]="role === 'customer'" (click)="role = 'customer'">Customer</button>
            <button type="button" class="role-btn" [class.active]="role === 'vendor'" (click)="role = 'vendor'">Vendor</button>
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading">
            {{ loading ? 'Creating...' : 'Create Account' }}
          </button>
        </form>

        <p class="auth-footer">
          Already have an account? <a routerLink="/auth/login" class="link">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: #000;
    }
    .auth-card {
      width: 100%;
      max-width: 400px;
      border: 2px solid #222;
      padding: 32px 24px;
      background: #0a0a0a;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo-mark {
      width: 48px;
      height: 48px;
      margin: 0 auto 16px;
    }
    .auth-title {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 4px;
      background: linear-gradient(90deg, #00bfa6, #00796b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .auth-subtitle {
      color: #666;
      margin-top: 8px;
      font-size: 14px;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .field__label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #aaa;
    }
    .field__input {
      padding: 12px;
      background: #111;
      border: 1px solid #333;
      color: #fff;
      font-size: 16px;
      transition: border-color 120ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .field__input:focus {
      border-color: #00bfa6;
      box-shadow: 0 0 0 2px rgba(0, 191, 166, 0.15);
    }
    .role-toggle {
      display: flex;
      gap: 0;
      border: 1px solid #333;
    }
    .role-btn {
      flex: 1;
      padding: 10px;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #111;
      color: #666;
      border: none;
      cursor: pointer;
      transition: all 200ms;
    }
    .role-btn.active {
      background: linear-gradient(90deg, #00bfa6, #00796b);
      color: #000;
    }
    .btn-primary {
      padding: 14px;
      background: linear-gradient(90deg, #00bfa6, #00796b);
      color: #000;
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      border: none;
      cursor: pointer;
      transition: transform 120ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .btn-primary:active { transform: scale(0.97); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .auth-footer {
      text-align: center;
      margin-top: 24px;
      color: #666;
      font-size: 14px;
    }
    .link { color: #00bfa6; font-weight: 600; }
  `],
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  role: 'customer' | 'vendor' = 'customer';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) { }

  onSubmit(): void {
    if (!this.name || !this.email || !this.password) {
      this.toast.warning('Please fill in all fields.');
      return;
    }
    if (this.password.length < 8) {
      this.toast.warning('Password must be at least 8 characters.');
      return;
    }
    this.loading = true;
    this.auth.register({ name: this.name, email: this.email, password: this.password, role: this.role }).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success('Account created. Check your email for the OTP.');
        this.router.navigate(['/auth/verify-otp'], { queryParams: { email: this.email } });
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.message || 'Registration failed.');
      },
    });
  }
}
