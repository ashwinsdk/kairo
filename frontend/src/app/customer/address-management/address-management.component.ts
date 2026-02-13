import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-address-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="addresses-page">
      <button class="back-btn" (click)="goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      <div class="header-row">
        <h1 class="page-title">My Addresses</h1>
        @if (addresses().length < 4) {
          <button class="add-btn" (click)="openForm()">+ Add</button>
        }
      </div>

      @if (loading()) {
        @for (i of [1,2]; track i) {
          <div class="addr-card skeleton">
            <div class="skeleton-line w80"></div>
            <div class="skeleton-line w60"></div>
          </div>
        }
      }

      @for (addr of addresses(); track addr.id) {
        <div class="addr-card" [class.default]="addr.is_default">
          @if (addr.is_default) {
            <span class="default-badge">DEFAULT</span>
          }
          <div class="addr-label">{{ addr.label || 'Address' }}</div>
          <p class="addr-line">{{ addr.line1 }}</p>
          @if (addr.line2) {
            <p class="addr-line">{{ addr.line2 }}</p>
          }
          <p class="addr-line">{{ addr.city }}, {{ addr.state }} - {{ addr.pincode }}</p>
          <div class="addr-actions">
            @if (!addr.is_default) {
              <button class="small-btn" (click)="setDefault(addr.id)">Set Default</button>
            }
            <button class="small-btn" (click)="editAddress(addr)">Edit</button>
            <button class="small-btn small-btn--danger" (click)="deleteAddress(addr.id)">Delete</button>
          </div>
        </div>
      }

      @if (!loading() && addresses().length === 0) {
        <div class="empty">
          <p>No addresses saved</p>
          <span>Add up to 4 addresses</span>
        </div>
      }

      <!-- Add/Edit Form Modal -->
      @if (showForm()) {
        <div class="modal-overlay" (click)="closeForm()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal-title">{{ editingId ? 'Edit' : 'Add' }} Address</h3>

            <div class="form-group">
              <label class="form-label">Label</label>
              <input
                type="text"
                [(ngModel)]="form.label"
                placeholder="e.g. Home, Office"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Address Line 1</label>
              <input
                type="text"
                [(ngModel)]="form.line1"
                placeholder="Street address"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Address Line 2</label>
              <input
                type="text"
                [(ngModel)]="form.line2"
                placeholder="Apartment, floor, etc."
                class="form-input"
              />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">City</label>
                <input type="text" [(ngModel)]="form.city" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">State</label>
                <input type="text" [(ngModel)]="form.state" class="form-input" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Pincode</label>
                <input type="text" [(ngModel)]="form.pincode" maxlength="6" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">
                  <input type="checkbox" [(ngModel)]="form.is_default" /> Default
                </label>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn btn--ghost" (click)="closeForm()">Cancel</button>
              <button class="btn btn--primary" (click)="saveAddress()" [disabled]="!isFormValid()">
                {{ editingId ? 'Update' : 'Add' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    .addresses-page { padding: 16px; }
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
    .add-btn {
      padding: 8px 16px;
      background: linear-gradient(90deg, #00bfa6, #00796b);
      color: #000;
      font-size: 13px;
      font-weight: 700;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
    }

    .addr-card {
      padding: 14px;
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
      margin-bottom: 8px;
      position: relative;
    }
    .addr-card.default { border-color: #00bfa6; }
    .default-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 9px;
      font-weight: 700;
      color: #00bfa6;
      letter-spacing: 1px;
    }
    .addr-label {
      font-size: 12px;
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
    .addr-actions {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }
    .small-btn {
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 4px;
      border: 1px solid #333;
      background: transparent;
      color: #888;
      cursor: pointer;
      font-family: inherit;
      transition: all 200ms;
    }
    .small-btn:hover { border-color: #00bfa6; color: #00bfa6; }
    .small-btn--danger:hover { border-color: #ef5350; color: #ef5350; }

    .empty {
      text-align: center;
      padding: 48px 16px;
      color: #666;
    }
    .empty p { font-size: 15px; margin: 0 0 4px; }
    .empty span { font-size: 13px; }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 200;
      animation: fadeIn 200ms ease;
    }
    .modal {
      background: #111;
      border: 1px solid #333;
      border-radius: 16px 16px 0 0;
      padding: 24px;
      max-width: 480px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 300ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
      margin: 0 0 16px;
    }
    .form-group { margin-bottom: 12px; }
    .form-label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .form-input {
      width: 100%;
      padding: 10px;
      background: #0a0a0a;
      border: 1px solid #333;
      border-radius: 6px;
      color: #fff;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
    }
    .form-input:focus { border-color: #00bfa6; }
    .form-row {
      display: flex;
      gap: 12px;
    }
    .form-row .form-group { flex: 1; }
    .modal-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
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
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn--ghost {
      background: transparent;
      border: 1px solid #333;
      color: #ccc;
    }
    .btn--primary {
      background: linear-gradient(90deg, #00bfa6, #00796b);
      color: #000;
    }

    .skeleton { pointer-events: none; }
    .skeleton-line {
      height: 14px;
      background: #222;
      border-radius: 4px;
      margin-bottom: 8px;
      animation: shimmer 1.2s ease-in-out infinite;
    }
    .w80 { width: 80%; }
    .w60 { width: 60%; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
  `],
})
export class AddressManagementComponent implements OnInit {
    addresses = signal<any[]>([]);
    loading = signal(true);
    showForm = signal(false);
    editingId: number | null = null;

    form = {
        label: '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
        is_default: false,
    };

    constructor(
        private api: ApiService,
        private toast: ToastService,
    ) { }

    ngOnInit() {
        this.loadAddresses();
    }

    private loadAddresses() {
        this.api.getAddresses().subscribe({
            next: (res: any) => {
                this.addresses.set(res.data || []);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    openForm() {
        this.editingId = null;
        this.form = { label: '', line1: '', line2: '', city: '', state: '', pincode: '', is_default: false };
        this.showForm.set(true);
    }

    editAddress(addr: any) {
        this.editingId = addr.id;
        this.form = {
            label: addr.label || '',
            line1: addr.line1 || '',
            line2: addr.line2 || '',
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
            is_default: addr.is_default || false,
        };
        this.showForm.set(true);
    }

    closeForm() {
        this.showForm.set(false);
    }

    isFormValid(): boolean {
        return !!(this.form.line1 && this.form.city && this.form.state && this.form.pincode);
    }

    saveAddress() {
        if (!this.isFormValid()) return;

        const obs = this.editingId
            ? this.api.updateAddress(this.editingId, this.form)
            : this.api.createAddress(this.form);

        obs.subscribe({
            next: () => {
                this.toast.show(this.editingId ? 'Address updated' : 'Address added', 'success');
                this.closeForm();
                this.loadAddresses();
            },
            error: (err: any) => this.toast.show(err.error?.message || 'Failed to save', 'error'),
        });
    }

    setDefault(id: number) {
        this.api.updateAddress(id, { is_default: true }).subscribe({
            next: () => {
                this.toast.show('Default address updated', 'success');
                this.loadAddresses();
            },
        });
    }

    deleteAddress(id: number) {
        this.api.deleteAddress(id).subscribe({
            next: () => {
                this.toast.show('Address deleted', 'success');
                this.loadAddresses();
            },
            error: (err: any) => this.toast.show(err.error?.message || 'Failed to delete', 'error'),
        });
    }

    goBack() {
        history.back();
    }
}
