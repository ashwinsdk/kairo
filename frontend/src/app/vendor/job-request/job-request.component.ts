import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-job-request',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="job-page">
      <button class="back-btn" (click)="goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      @if (loading()) {
        <div class="skeleton-block">
          <div class="skeleton-line w80"></div>
          <div class="skeleton-line w60"></div>
        </div>
      }

      @if (booking()) {
        <h1 class="page-title">Job #{{ booking().id }}</h1>

        <!-- Status -->
        <div class="status-bar" [attr.data-status]="booking().status">
          {{ booking().status | titlecase }}
        </div>

        <!-- Details -->
        <div class="detail-card">
          <div class="detail-row">
            <span class="label">Service</span>
            <span class="value">{{ booking().service_name }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Customer</span>
            <span class="value">{{ booking().customer_name }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Date</span>
            <span class="value">{{ booking().scheduled_date | date:'mediumDate' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Time</span>
            <span class="value">{{ booking().scheduled_time }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Price</span>
            <span class="value price">₹{{ booking().final_price || booking().estimated_price }}</span>
          </div>
          @if (booking().address_line1) {
            <div class="detail-row">
              <span class="label">Address</span>
              <span class="value">{{ booking().address_line1 }}, {{ booking().address_city }}</span>
            </div>
          }
          @if (booking().notes) {
            <div class="detail-row">
              <span class="label">Notes</span>
              <span class="value">{{ booking().notes }}</span>
            </div>
          }
        </div>

        <!-- Vendor Actions -->
        <div class="actions">
          @switch (booking().status) {
            @case ('requested') {
              <button class="action-btn action-btn--primary" (click)="updateStatus('accepted')">
                Accept Job
              </button>
              <button class="action-btn action-btn--danger" (click)="updateStatus('rejected')">
                Decline
              </button>
            }
            @case ('accepted') {
              <button class="action-btn action-btn--secondary" (click)="updateStatus('on_the_way')">
                On the Way
              </button>
              <button class="action-btn action-btn--secondary" (click)="updateStatus('arrived')">
                Arrived
              </button>

              <!-- OTP verification for arrival -->
              <div class="otp-section">
                <h3 class="otp-title">Enter Customer OTP</h3>
                <p class="otp-desc">Ask the customer for their arrival OTP</p>
                <div class="otp-input-row">
                  @for (i of [0,1,2,3]; track i) {
                    <input
                      type="text"
                      maxlength="1"
                      class="otp-digit"
                      [value]="otpDigits[i] || ''"
                      (input)="onOtpInput($event, i)"
                      (keydown)="onOtpKeydown($event, i)"
                    />
                  }
                </div>
                <button
                  class="action-btn action-btn--primary"
                  [disabled]="getOtpString().length !== 4"
                  (click)="verifyOtp()"
                >Verify & Start Job</button>
              </div>

              <a [routerLink]="['/vendor/chat', booking().id]" class="action-btn action-btn--secondary">
                Chat with Customer
              </a>
            }
            @case ('on_the_way') {
              <button class="action-btn action-btn--secondary" (click)="updateStatus('arrived')">
                Arrived
              </button>
              <a [routerLink]="['/vendor/chat', booking().id]" class="action-btn action-btn--secondary">
                Chat with Customer
              </a>
            }
            @case ('arrived') {
              <!-- OTP verification for arrival -->
              <div class="otp-section">
                <h3 class="otp-title">Enter Customer OTP</h3>
                <p class="otp-desc">Ask the customer for their arrival OTP</p>
                <div class="otp-input-row">
                  @for (i of [0,1,2,3]; track i) {
                    <input
                      type="text"
                      maxlength="1"
                      class="otp-digit"
                      [value]="otpDigits[i] || ''"
                      (input)="onOtpInput($event, i)"
                      (keydown)="onOtpKeydown($event, i)"
                    />
                  }
                </div>
                <button
                  class="action-btn action-btn--primary"
                  [disabled]="getOtpString().length !== 4"
                  (click)="verifyOtp()"
                >Verify & Start Job</button>
              </div>

              <a [routerLink]="['/vendor/chat', booking().id]" class="action-btn action-btn--secondary">
                Chat with Customer
              </a>
            }
            @case ('in_progress') {
              <!-- Price update -->
              <div class="price-update">
                <h3 class="section-label">Update Final Price</h3>
                <div class="price-input-row">
                  <span class="rupee">₹</span>
                  <input
                    type="number"
                    [(ngModel)]="updatedPrice"
                    class="price-input"
                    [placeholder]="booking().estimated_price"
                  />
                </div>
                @if (updatedPrice && updatedPrice !== booking().estimated_price) {
                  <button class="action-btn action-btn--secondary" (click)="updatePrice()">
                    Update Price
                  </button>
                }
              </div>

              <button class="action-btn action-btn--primary" (click)="updateStatus('completed')">
                Mark Completed
              </button>

              <a [routerLink]="['/vendor/chat', booking().id]" class="action-btn action-btn--secondary">
                Chat with Customer
              </a>
            }
            @case ('completed') {
              <div class="completed-msg">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00bfa6" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <p>Job completed</p>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .job-page { padding: 16px; }
    .back-btn {
      display: flex; align-items: center; gap: 4px;
      background: none; border: none; color: #888;
      font-size: 14px; font-family: inherit; cursor: pointer;
      padding: 0; margin-bottom: 16px;
    }
    .page-title {
      font-size: 22px; font-weight: 800; color: #fff;
      margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;
    }
    .status-bar {
      padding: 12px; border-radius: 8px; text-align: center;
      font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
      font-size: 14px; margin-bottom: 20px;
    }
    .status-bar[data-status="requested"] { background: #332b00; color: #ffc107; border: 1px solid #665500; }
    .status-bar[data-status="accepted"] { background: #0a2a1a; color: #00bfa6; border: 1px solid #00796b; }
    .status-bar[data-status="on_the_way"] { background: #0a1a2a; color: #42a5f5; border: 1px solid #1565c0; }
    .status-bar[data-status="arrived"] { background: #0a1a2a; color: #64b5f6; border: 1px solid #1976d2; }
    .status-bar[data-status="in_progress"] { background: #0a1a2a; color: #42a5f5; border: 1px solid #1565c0; }
    .status-bar[data-status="completed"] { background: #0a2a0a; color: #66bb6a; border: 1px solid #2e7d32; }
    .status-bar[data-status="cancelled"] { background: #2a0a0a; color: #ef5350; border: 1px solid #c62828; }
    .status-bar[data-status="rejected"] { background: #2a0a0a; color: #ef5350; border: 1px solid #c62828; }

    .detail-card {
      background: #111; border: 1px solid #222; border-radius: 8px;
      overflow: hidden; margin-bottom: 20px;
    }
    .detail-row {
      display: flex; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid #1a1a1a;
    }
    .detail-row:last-child { border-bottom: none; }
    .label { font-size: 13px; color: #666; }
    .value { font-size: 14px; font-weight: 600; color: #ccc; text-align: right; max-width: 60%; }
    .value.price { color: #00bfa6; font-weight: 800; font-size: 16px; }

    .actions { display: flex; flex-direction: column; gap: 12px; }
    .action-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 700;
      font-family: inherit; cursor: pointer; border: none; text-decoration: none;
      text-transform: uppercase; letter-spacing: 0.5px; transition: transform 120ms;
    }
    .action-btn:active { transform: scale(0.98); }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .action-btn--primary { background: linear-gradient(90deg, #00bfa6, #00796b); color: #000; }
    .action-btn--secondary { background: transparent; border: 1px solid #333; color: #ccc; }
    .action-btn--danger { background: transparent; border: 1px solid #ef5350; color: #ef5350; }

    /* OTP */
    .otp-section, .price-update {
      padding: 16px; background: #111; border: 1px solid #222; border-radius: 8px;
    }
    .otp-title { font-size: 14px; font-weight: 700; color: #fff; margin: 0 0 4px; text-transform: uppercase; }
    .otp-desc { font-size: 12px; color: #888; margin: 0 0 12px; }
    .otp-input-row { display: flex; gap: 8px; margin-bottom: 12px; justify-content: center; }
    .otp-digit {
      width: 40px; height: 48px; text-align: center; font-size: 20px; font-weight: 700;
      color: #fff; background: #0a0a0a; border: 1px solid #333; border-radius: 8px;
      font-family: 'Source Code Pro', monospace; outline: none;
    }
    .otp-digit:focus { border-color: #00bfa6; }

    .section-label { font-size: 14px; font-weight: 700; color: #fff; margin: 0 0 8px; text-transform: uppercase; }
    .price-input-row { display: flex; align-items: center; gap: 4px; margin-bottom: 12px; }
    .rupee { font-size: 20px; font-weight: 700; color: #00bfa6; }
    .price-input {
      flex: 1; padding: 10px; background: #0a0a0a; border: 1px solid #333;
      border-radius: 6px; color: #fff; font-size: 18px; font-weight: 700;
      font-family: 'Source Code Pro', monospace; outline: none; box-sizing: border-box;
    }
    .price-input:focus { border-color: #00bfa6; }

    .completed-msg {
      text-align: center; padding: 32px; color: #00bfa6;
    }
    .completed-msg p { font-size: 16px; font-weight: 700; margin: 12px 0 0; }

    .skeleton-block { margin-bottom: 20px; }
    .skeleton-line { height: 14px; background: #222; border-radius: 4px; margin-bottom: 8px; animation: shimmer 1.2s ease-in-out infinite; }
    .w80 { width: 80%; }
    .w60 { width: 60%; }
    @keyframes shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
  `],
})
export class JobRequestComponent implements OnInit {
  booking = signal<any>(null);
  loading = signal(true);
  otpDigits: string[] = ['', '', '', ''];
  updatedPrice: number | null = null;

  private bookingId = '';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private toast: ToastService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.bookingId = this.route.snapshot.paramMap.get('id') || '';
    this.loadBooking();
  }

  private loadBooking() {
    if (!this.bookingId) return;
    this.api.getBookingDetail(this.bookingId).subscribe({
      next: (res: any) => {
        const b = res.data;
        this.booking.set(b);
        this.updatedPrice = b.final_price || b.estimated_price;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  updateStatus(status: string) {
    this.api.updateBookingStatus(this.bookingId, { status }).subscribe({
      next: () => {
        this.toast.show(`Booking ${status}`, 'success');
        this.loadBooking();
      },
      error: (err: any) => this.toast.show(err.error?.message || 'Failed', 'error'),
    });
  }

  getOtpString(): string {
    return this.otpDigits.join('');
  }

  onOtpInput(event: any, idx: number) {
    const val = event.target.value;
    this.otpDigits[idx] = val;
    if (val && idx < 3) {
      const next = event.target.parentElement?.children[idx + 1] as HTMLInputElement;
      next?.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, idx: number) {
    if (event.key === 'Backspace' && !this.otpDigits[idx] && idx > 0) {
      const prev = (event.target as HTMLElement).parentElement?.children[idx - 1] as HTMLInputElement;
      prev?.focus();
    }
  }

  verifyOtp() {
    const otp = this.getOtpString();
    if (otp.length !== 4) return;
    this.api.verifyJobOtp(this.bookingId, otp).subscribe({
      next: () => {
        this.toast.show('OTP verified, job started!', 'success');
        this.loadBooking();
      },
      error: (err: any) => this.toast.show(err.error?.message || 'Invalid OTP', 'error'),
    });
  }

  updatePrice() {
    if (!this.updatedPrice) return;
    this.api.updateBookingPrice(this.bookingId, { final_price: this.updatedPrice }).subscribe({
      next: () => {
        this.toast.show('Price updated', 'success');
        this.loadBooking();
      },
      error: (err: any) => this.toast.show(err.error?.message || 'Failed', 'error'),
    });
  }

  goBack() {
    history.back();
  }
}
