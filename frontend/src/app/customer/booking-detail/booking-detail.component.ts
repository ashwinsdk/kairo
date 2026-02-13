import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="booking-detail">
      <button class="back-btn" (click)="goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      @if (loading()) {
        <div class="skeleton-block">
          <div class="skeleton-line w80"></div>
          <div class="skeleton-line w60"></div>
          <div class="skeleton-line w40"></div>
        </div>
      }

      @if (booking()) {
        <h1 class="page-title">Booking #{{ booking().id }}</h1>

        <!-- Status Header -->
        <div class="status-header" [attr.data-status]="booking().status">
          <span class="status-label">{{ booking().status | titlecase }}</span>
        </div>

        <!-- Timeline -->
        <div class="timeline">
          @for (step of timelineSteps(); track step.status) {
            <div class="timeline-step" [class.completed]="step.completed" [class.current]="step.current">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <span class="timeline-label">{{ step.label }}</span>
                @if (step.time) {
                  <span class="timeline-time">{{ step.time | date:'short' }}</span>
                }
              </div>
            </div>
          }
        </div>

        <!-- Details -->
        <div class="detail-card">
          <div class="detail-row">
            <span class="detail-label">Service</span>
            <span class="detail-value">{{ booking().service_name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Vendor</span>
            <span class="detail-value">{{ booking().vendor_name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date</span>
            <span class="detail-value">{{ booking().scheduled_date | date:'mediumDate' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Time</span>
            <span class="detail-value">{{ booking().scheduled_time }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Price</span>
            <span class="detail-value price">₹{{ booking().final_price || booking().estimated_price }}</span>
          </div>
          @if (booking().notes) {
            <div class="detail-row">
              <span class="detail-label">Notes</span>
              <span class="detail-value">{{ booking().notes }}</span>
            </div>
          }
        </div>

        <!-- OTP for vendor arrival -->
        @if (['requested', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(booking().status)) {
          <div class="otp-card">
            <h3 class="otp-title">Arrival OTP</h3>
            <p class="otp-desc">Share this with the vendor when they arrive</p>
            <div class="otp-code">{{ booking().job_otp || '—' }}</div>
            @if (!booking().job_otp) {
              <p class="otp-note">OTP will appear after the booking is created with OTP enabled.</p>
            }
          </div>
        }

        <!-- Actions -->
        <div class="actions">
          @if (['requested', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(booking().status)) {
            <a [routerLink]="['/home/chat', booking().id]" class="action-btn action-btn--secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Chat with Vendor
            </a>
          }

          @if (booking().status === 'requested') {
            <button class="action-btn action-btn--danger" (click)="cancelBooking()">Cancel Booking</button>
          }

          @if (booking().status === 'completed' && !booking().has_rated) {
            <!-- Rating -->
            <div class="rating-section">
              <h3 class="rating-title">Rate this service</h3>
              <div class="star-row">
                @for (star of [1,2,3,4,5]; track star) {
                  <button
                    class="star-btn"
                    [class.active]="rating >= star"
                    (click)="rating = star"
                  ><svg class="star-icon" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></button>
                }
              </div>
              <textarea
                [(ngModel)]="ratingComment"
                placeholder="Leave a comment (optional)"
                rows="3"
                class="rating-input"
              ></textarea>
              <button
                class="action-btn action-btn--primary"
                [disabled]="rating === 0"
                (click)="submitRating()"
              >Submit Rating</button>
            </div>
          }

          @if (booking().status === 'completed' && !booking().payment_status) {
            <div class="payment-section">
              <h3 class="rating-title">Payment</h3>
              <div class="payment-options">
                <button
                  class="pay-option"
                  [class.active]="paymentMethod === 'online'"
                  (click)="paymentMethod = 'online'"
                >Online (Mock)</button>
                <button
                  class="pay-option"
                  [class.active]="paymentMethod === 'cash'"
                  (click)="paymentMethod = 'cash'"
                >Cash</button>
              </div>
              <button
                class="action-btn action-btn--primary"
                (click)="processPayment()"
                [disabled]="!paymentMethod"
              >Pay ₹{{ booking().final_price || booking().estimated_price }}</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .booking-detail { padding: 16px; }
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
    .page-title {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      margin: 0 0 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .status-header {
      padding: 12px 16px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 20px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 14px;
    }
    .status-header[data-status="requested"] { background: #332b00; color: #ffc107; border: 1px solid #665500; }
    .status-header[data-status="accepted"] { background: #0a2a1a; color: #00bfa6; border: 1px solid #00796b; }
    .status-header[data-status="on_the_way"] { background: #0a1a2a; color: #42a5f5; border: 1px solid #1565c0; }
    .status-header[data-status="arrived"] { background: #0a1a2a; color: #64b5f6; border: 1px solid #1976d2; }
    .status-header[data-status="in_progress"] { background: #0a1a2a; color: #42a5f5; border: 1px solid #1565c0; }
    .status-header[data-status="completed"] { background: #0a2a0a; color: #66bb6a; border: 1px solid #2e7d32; }
    .status-header[data-status="cancelled"] { background: #2a0a0a; color: #ef5350; border: 1px solid #c62828; }
    .status-header[data-status="rejected"] { background: #2a0a0a; color: #ef5350; border: 1px solid #c62828; }

    /* Timeline */
    .timeline {
      margin-bottom: 20px;
      padding-left: 20px;
      border-left: 2px solid #222;
    }
    .timeline-step {
      position: relative;
      padding: 0 0 20px 20px;
    }
    .timeline-dot {
      position: absolute;
      left: -27px;
      top: 2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #333;
      border: 2px solid #333;
    }
    .timeline-step.completed .timeline-dot {
      background: #00bfa6;
      border-color: #00bfa6;
    }
    .timeline-step.current .timeline-dot {
      background: #000;
      border-color: #00bfa6;
      box-shadow: 0 0 0 4px rgba(0, 191, 166, 0.2);
    }
    .timeline-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .timeline-label {
      font-size: 14px;
      color: #888;
      font-weight: 600;
    }
    .timeline-step.completed .timeline-label,
    .timeline-step.current .timeline-label { color: #fff; }
    .timeline-time {
      font-size: 11px;
      color: #555;
      font-family: 'Source Code Pro', monospace;
    }

    /* Detail card */
    .detail-card {
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #1a1a1a;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label {
      font-size: 13px;
      color: #666;
    }
    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #ccc;
    }
    .detail-value.price {
      color: #00bfa6;
      font-weight: 800;
      font-size: 16px;
    }

    /* OTP card */
    .otp-card {
      padding: 20px;
      background: #111;
      border: 1px solid #00bfa6;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 20px;
    }
    .otp-title {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 4px;
      text-transform: uppercase;
    }
    .otp-desc {
      font-size: 12px;
      color: #888;
      margin: 0 0 12px;
    }
    .otp-code {
      font-size: 32px;
      font-weight: 800;
      color: #00bfa6;
      font-family: 'Source Code Pro', monospace;
      letter-spacing: 8px;
    }
    .otp-note {
      margin: 10px 0 0;
      font-size: 11px;
      color: #666;
    }

    /* Actions */
    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      border: none;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: transform 120ms;
    }
    .action-btn:active { transform: scale(0.98); }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .action-btn--primary {
      background: linear-gradient(90deg, #00bfa6, #00796b);
      color: #000;
    }
    .action-btn--secondary {
      background: transparent;
      border: 1px solid #333;
      color: #ccc;
    }
    .action-btn--danger {
      background: transparent;
      border: 1px solid #ef5350;
      color: #ef5350;
    }

    /* Rating */
    .rating-section, .payment-section {
      padding: 16px;
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
    }
    .rating-title {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 12px;
      text-transform: uppercase;
    }
    .star-row {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
    .star-btn {
      font-size: 28px;
      background: none;
      border: none;
      color: #333;
      cursor: pointer;
      transition: color 120ms, transform 120ms;
    }
    .star-btn.active { color: #ffc107; }
    .star-btn:active { transform: scale(1.2); }
    .rating-input {
      width: 100%;
      padding: 10px;
      background: #0a0a0a;
      border: 1px solid #333;
      border-radius: 6px;
      color: #ccc;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      outline: none;
      box-sizing: border-box;
      margin-bottom: 12px;
    }

    .payment-options {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
    .pay-option {
      flex: 1;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #333;
      background: transparent;
      color: #ccc;
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 200ms;
    }
    .pay-option.active {
      border-color: #00bfa6;
      color: #00bfa6;
      background: rgba(0, 191, 166, 0.1);
    }

    .skeleton-block { margin-bottom: 20px; }
    .skeleton-line {
      height: 14px;
      background: #222;
      border-radius: 4px;
      margin-bottom: 8px;
      animation: shimmer 1.2s ease-in-out infinite;
    }
    .w80 { width: 80%; }
    .w60 { width: 60%; }
    .w40 { width: 40%; }
    @keyframes shimmer {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }
  `],
})
export class BookingDetailComponent implements OnInit {
  booking = signal<any>(null);
  loading = signal(true);
  timelineSteps = signal<any[]>([]);
  rating = 0;
  ratingComment = '';
  paymentMethod = '';

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
        this.buildTimeline(b);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private buildTimeline(b: any) {
    const statuses = ['requested', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'completed'];
    const currentIdx = statuses.indexOf(b.status);
    const history = b.status_history || [];

    this.timelineSteps.set(statuses.map((s, i) => {
      const h = history.find((h: any) => h.status === s);
      return {
        status: s,
        label: s.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        completed: i <= currentIdx,
        current: i === currentIdx,
        time: h?.created_at || null,
      };
    }));
  }

  cancelBooking() {
    this.api.updateBookingStatus(this.bookingId, { status: 'cancelled' }).subscribe({
      next: () => {
        this.toast.show('Booking cancelled', 'success');
        this.loadBooking();
      },
      error: (err: any) => this.toast.show(err.error?.message || 'Failed to cancel', 'error'),
    });
  }

  submitRating() {
    this.api.rateBooking(this.bookingId, { rating: this.rating, comment: this.ratingComment }).subscribe({
      next: () => {
        this.toast.show('Rating submitted!', 'success');
        this.loadBooking();
      },
      error: (err: any) => this.toast.show(err.error?.message || 'Failed to submit rating', 'error'),
    });
  }

  processPayment() {
    this.api.processPayment({
      booking_id: this.bookingId,
      method: this.paymentMethod,
    }).subscribe({
      next: (res: any) => {
        const payment = res.data;
        if (payment.status === 'completed') {
          this.toast.show('Payment successful!', 'success');
        } else {
          this.toast.show('Payment failed. Please try again.', 'error');
        }
        this.loadBooking();
      },
      error: (err: any) => this.toast.show(err.error?.message || 'Payment failed', 'error'),
    });
  }

  goBack() {
    history.back();
  }
}
