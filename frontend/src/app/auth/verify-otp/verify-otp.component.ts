import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <img src="/kairo.png" alt="Kairo Logo" class="logo-mark" />
          <h1 class="auth-title">VERIFY</h1>
          <p class="auth-subtitle">Enter the 6-digit code sent to</p>
          <p class="auth-email">{{ email }}</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="otp-group">
            @for (i of [0,1,2,3,4,5]; track i) {
              <input
                type="text"
                maxlength="1"
                class="otp-input"
                [id]="'otp-' + i"
                (input)="onOtpInput($event, i)"
                (keydown)="onOtpKeydown($event, i)"
                inputmode="numeric"
                autocomplete="one-time-code"
              />
            }
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading || otpCode.length < 6">
            {{ loading ? 'Verifying...' : 'Verify' }}
          </button>
        </form>

        <div class="resend-section">
          <button class="resend-btn" (click)="resendOtp()" [disabled]="resendCooldown > 0">
            {{ resendCooldown > 0 ? 'Resend in ' + resendCooldown + 's' : 'Resend Code' }}
          </button>
          <p class="hint">Code expires in 10 minutes</p>
        </div>
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
    .auth-email {
      color: #00bfa6;
      font-weight: 600;
      font-size: 14px;
      margin-top: 4px;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .otp-group {
      display: flex;
      gap: 8px;
      justify-content: center;
    }
    .otp-input {
      width: 48px;
      height: 56px;
      text-align: center;
      font-size: 24px;
      font-weight: 700;
      font-family: 'Source Code Pro', monospace;
      background: #111;
      border: 2px solid #333;
      color: #00bfa6;
      transition: border-color 120ms;
    }
    .otp-input:focus {
      border-color: #00bfa6;
      box-shadow: 0 0 0 2px rgba(0, 191, 166, 0.15);
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
    .resend-section {
      text-align: center;
      margin-top: 24px;
    }
    .resend-btn {
      color: #00bfa6;
      font-size: 14px;
      font-weight: 600;
      background: none;
      border: none;
      cursor: pointer;
    }
    .resend-btn:disabled { color: #444; cursor: not-allowed; }
    .hint {
      color: #444;
      font-size: 12px;
      margin-top: 8px;
    }
  `],
})
export class VerifyOtpComponent implements OnInit {
  email = '';
  otpCode = '';
  loading = false;
  resendCooldown = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParams['email'] || '';
    if (!this.email) {
      this.router.navigate(['/auth/login']);
    }
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '');
    input.value = value;
    this.updateOtpCode();
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      next?.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;
      if (!input.value && index > 0) {
        const prev = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
        prev?.focus();
      }
    }
  }

  updateOtpCode(): void {
    let code = '';
    for (let i = 0; i < 6; i++) {
      const el = document.getElementById(`otp-${i}`) as HTMLInputElement;
      code += el?.value || '';
    }
    this.otpCode = code;
  }

  onSubmit(): void {
    if (this.otpCode.length < 6) return;
    this.loading = true;
    this.auth.verifyOtp(this.email, this.otpCode).subscribe({
      next: (res) => {
        this.loading = false;
        this.toast.success('Email verified successfully!');
        const role = res.data?.user?.role;
        if (role === 'vendor') this.router.navigate(['/vendor']);
        else if (role === 'admin') this.router.navigate(['/admin']);
        else this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.message || 'OTP verification failed.');
      },
    });
  }

  resendOtp(): void {
    this.resendCooldown = 30;
    const interval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) clearInterval(interval);
    }, 1000);

    this.auth.resendOtp(this.email).subscribe({
      next: () => this.toast.info('OTP resent to your email.'),
      error: (err) => this.toast.error(err.error?.message || 'Failed to resend OTP.'),
    });
  }
}
