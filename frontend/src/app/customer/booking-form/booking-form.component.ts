import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="booking-form">
      <button class="back-btn" (click)="goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      <h1 class="page-title">Book Service</h1>

      @if (loading()) {
        <div class="skeleton-block">
          <div class="skeleton-line w80"></div>
          <div class="skeleton-line w60"></div>
        </div>
      } @else {
        <!-- Service summary -->
        <div class="summary-card">
          <h3 class="summary-service">{{ serviceName() }}</h3>
          <p class="summary-vendor">{{ vendorName() }}</p>
          <p class="summary-price">₹{{ basePrice() }}</p>
        </div>

        <!-- Date picker -->
        <div class="form-group">
          <label class="form-label">Date</label>
          <input
            type="date"
            [(ngModel)]="selectedDate"
            [min]="minDate"
            class="form-input"
          />
        </div>

        <!-- Time picker -->
        <div class="form-group">
          <label class="form-label">Time</label>
          <div class="time-grid">
            @for (slot of timeSlots; track slot) {
              <button
                class="time-slot"
                [class.active]="selectedTime === slot"
                (click)="selectedTime = slot"
              >{{ slot }}</button>
            }
          </div>
        </div>

        <!-- Address Selection -->
        <div class="form-group">
          <label class="form-label">Service Address</label>
          @if (addresses().length > 0) {
            @for (addr of addresses(); track addr.id) {
              <button
                class="address-card"
                [class.active]="selectedAddress === addr.id"
                (click)="selectedAddress = addr.id"
              >
                <div class="addr-tag">{{ addr.label || 'Address' }}</div>
                <p class="addr-line">{{ addr.line1 }}</p>
                @if (addr.line2) {
                  <p class="addr-line">{{ addr.line2 }}</p>
                }
                <p class="addr-line">{{ addr.city }} - {{ addr.pincode }}</p>
              </button>
            }
          } @else {
            <p class="no-addr">No addresses saved. Add one in your profile.</p>
          }
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label class="form-label">Notes (optional)</label>
          <textarea
            [(ngModel)]="notes"
            placeholder="Any specific requirements..."
            rows="3"
            class="form-input form-textarea"
          ></textarea>
        </div>

        <!-- Price breakdown -->
        <div class="price-breakdown">
          <div class="price-row">
            <span>Service Charge</span>
            <span>₹{{ basePrice() }}</span>
          </div>
          <div class="price-row">
            <span>Platform Fee</span>
            <span>₹0</span>
          </div>
          <div class="price-row price-row--total">
            <span>Total</span>
            <span>₹{{ basePrice() }}</span>
          </div>
        </div>

        <!-- Submit -->
        <button
          class="submit-btn"
          [disabled]="submitting() || !isValid()"
          (click)="submitBooking()"
        >
          @if (submitting()) {
            <span class="spinner"></span>
          } @else {
            Confirm Booking
          }
        </button>
      }
    </div>
  `,
  styles: [`
    .booking-form { padding: 16px; }
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
      margin: 0 0 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .summary-card {
      padding: 16px;
      background: #111;
      border: 1px solid #00bfa6;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .summary-service {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 4px;
    }
    .summary-vendor {
      font-size: 13px;
      color: #888;
      margin: 0 0 8px;
    }
    .summary-price {
      font-size: 20px;
      font-weight: 800;
      color: #00bfa6;
      margin: 0;
    }

    .form-group { margin-bottom: 20px; }
    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .form-input {
      width: 100%;
      padding: 12px;
      background: #111;
      border: 1px solid #333;
      border-radius: 8px;
      color: #fff;
      font-size: 15px;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      transition: border-color 200ms;
    }
    .form-input:focus { border-color: #00bfa6; }
    .form-textarea { resize: vertical; min-height: 80px; }

    input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(1);
    }

    .time-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .time-slot {
      padding: 10px;
      background: #111;
      border: 1px solid #333;
      border-radius: 8px;
      color: #ccc;
      font-size: 13px;
      font-weight: 600;
      font-family: 'Source Code Pro', monospace;
      cursor: pointer;
      transition: all 200ms;
    }
    .time-slot.active {
      border-color: #00bfa6;
      color: #00bfa6;
      background: rgba(0, 191, 166, 0.1);
    }

    .address-card {
      display: block;
      width: 100%;
      text-align: left;
      padding: 12px;
      background: #111;
      border: 1px solid #333;
      border-radius: 8px;
      color: #ccc;
      margin-bottom: 8px;
      cursor: pointer;
      transition: border-color 200ms;
      font-family: inherit;
    }
    .address-card.active { border-color: #00bfa6; }
    .addr-tag {
      font-size: 11px;
      font-weight: 700;
      color: #00bfa6;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .addr-line {
      font-size: 13px;
      color: #888;
      margin: 0;
      line-height: 1.4;
    }
    .no-addr {
      font-size: 13px;
      color: #555;
      font-style: italic;
    }

    .price-breakdown {
      padding: 16px;
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .price-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: #888;
      padding: 6px 0;
    }
    .price-row--total {
      border-top: 1px solid #333;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 16px;
      font-weight: 800;
      color: #fff;
    }

    .submit-btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(90deg, #00bfa6, #00796b);
      color: #000;
      font-size: 15px;
      font-weight: 800;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-family: inherit;
      transition: transform 120ms, opacity 200ms;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .submit-btn:active { transform: scale(0.98); }
    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid transparent;
      border-top-color: #000;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

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
    @keyframes shimmer {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }
  `],
})
export class BookingFormComponent implements OnInit {
  serviceName = signal('');
  vendorName = signal('');
  basePrice = signal(0);
  addresses = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);

  selectedDate = '';
  selectedTime = '';
  selectedAddress: number | null = null;
  notes = '';
  minDate = '';

  private vendorId = '';
  private serviceId = '';

  timeSlots = [
    '08:00', '09:00', '10:00',
    '11:00', '12:00', '14:00',
    '15:00', '16:00', '17:00',
  ];

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private toast: ToastService,
    private router: Router,
  ) { }

  ngOnInit() {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    this.vendorId = this.route.snapshot.paramMap.get('vendorId') || '';
    this.serviceId = this.route.snapshot.paramMap.get('serviceId') || '';

    if (this.vendorId) {
      this.api.getVendorDetail(this.vendorId).subscribe({
        next: (res: any) => {
          const vendor = res.data;
          this.vendorName.set(vendor.business_name || '');
          const svc = (vendor.services || []).find((s: any) => s.id === this.serviceId);
          if (svc) {
            this.serviceName.set(svc.service_name);
            this.basePrice.set(svc.base_price || 0);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }

    this.api.getAddresses().subscribe({
      next: (res: any) => {
        const addrs = res.data || [];
        this.addresses.set(addrs);
        if (addrs.length > 0) {
          const defaultAddr = addrs.find((a: any) => a.is_default) || addrs[0];
          this.selectedAddress = defaultAddr.id;
        }
      },
    });
  }

  isValid(): boolean {
    return !!this.selectedDate && !!this.selectedTime && !!this.selectedAddress;
  }

  submitBooking() {
    if (!this.isValid()) return;
    this.submitting.set(true);

    this.api.createBooking({
      vendor_id: this.vendorId,
      service_id: this.serviceId,
      address_id: this.selectedAddress,
      scheduled_date: this.selectedDate,
      scheduled_time: this.selectedTime,
      notes: this.notes || undefined,
    }).subscribe({
      next: (res: any) => {
        const booking = res.data;
        this.toast.show('Booking created successfully!', 'success');
        this.router.navigate(['/home/booking', booking.id]);
      },
      error: (err: any) => {
        this.toast.show(err.error?.message || 'Booking failed', 'error');
        this.submitting.set(false);
      },
    });
  }

  goBack() {
    history.back();
  }
}
