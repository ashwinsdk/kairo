import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-vendor-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-page">
      <h1 class="page-title">Vendor Profile</h1>

      @if (loading()) {
        <div class="skeleton-card">
          <div class="skeleton-line w80"></div>
          <div class="skeleton-line w60"></div>
        </div>
      } @else {
        <!-- Basic Info -->
        <div class="card">
          <h3 class="card-title">Personal Info</h3>
          <div class="form-group">
            <label class="form-label">Name</label>
            <input type="text" [(ngModel)]="profile.name" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" [value]="profile.email" class="form-input" disabled />
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="tel" [(ngModel)]="profile.phone" class="form-input" />
          </div>
          <button class="save-btn" (click)="saveProfile()">Save Changes</button>
        </div>

        <!-- Business Info -->
        <div class="card">
          <h3 class="card-title">Business Info</h3>
          <div class="form-group">
            <label class="form-label">Business Name</label>
            <input type="text" [(ngModel)]="vendorProfile.business_name" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Bio</label>
            <textarea [(ngModel)]="vendorProfile.bio" rows="3" class="form-input form-textarea"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Service Radius (km)</label>
            <input type="number" [(ngModel)]="vendorProfile.service_radius_km" class="form-input" />
          </div>
          <button class="save-btn" (click)="saveVendorProfile()">Update Business Info</button>
        </div>

        <!-- KYC -->
        <div class="card">
          <h3 class="card-title">KYC Documents</h3>
          <div class="kyc-status" [attr.data-status]="kycStatus()">
            Status: {{ kycStatus() | titlecase }}
          </div>
          @if (kycStatus() !== 'verified') {
            <div class="form-group">
              <label class="form-label">Document Type</label>
              <select [(ngModel)]="docType" class="form-input">
                <option value="aadhaar">Aadhaar</option>
                <option value="pan">PAN Card</option>
                <option value="license">License</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Document Number</label>
              <input type="text" [(ngModel)]="docNumber" class="form-input" />
            </div>
            <button class="save-btn" (click)="uploadDoc()">Submit Document</button>
          }
        </div>

        <!-- Service Management -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">My Services</h3>
            <button class="add-service-btn" (click)="showAddService.set(true)">+ Add Service</button>
          </div>

          @if (services().length === 0) {
            <div class="empty-state">
              <p>No services added yet. Add your first service to start receiving bookings.</p>
            </div>
          }

          @for (service of services(); track service.id) {
            <div class="service-item" [class.inactive]="!service.is_active">
              <div class="service-info">
                <h4 class="service-name">{{ service.service_name }}</h4>
                <p class="service-desc">{{ service.description }}</p>
                <div class="service-meta">
                  <span class="price">₹{{ service.base_price }}</span>
                  <span class="divider">·</span>
                  <span>{{ service.duration_minutes }} min</span>
                  @if (!service.is_active) {
                    <span class="inactive-badge">Inactive</span>
                  }
                </div>
              </div>
              <button class="toggle-btn" (click)="toggleService(service)">
                {{ service.is_active ? 'Deactivate' : 'Activate' }}
              </button>
            </div>
          }
        </div>

        <!-- Logout -->
        <div class="card">
          <button class="logout-btn" (click)="showLogoutModal.set(true)">Logout</button>
        </div>
      }

      <!-- Add Service Modal -->
      @if (showAddService()) {
        <div class="modal-overlay" (click)="showAddService.set(false)">
          <div class="modal modal--wide" (click)="$event.stopPropagation()">
            <h3 class="modal-title">Add New Service</h3>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select [(ngModel)]="newService.category_id" class="form-input">
                <option value="">Select Category</option>
                @for (cat of categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Service Name</label>
              <input type="text" [(ngModel)]="newService.name" class="form-input" placeholder="e.g., Pipe Repair" />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea [(ngModel)]="newService.description" rows="3" class="form-input form-textarea" placeholder="Describe what you offer"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Price (₹)</label>
                <input type="number" [(ngModel)]="newService.base_price" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Duration (min)</label>
                <input type="number" [(ngModel)]="newService.duration_minutes" class="form-input" />
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn btn--ghost" (click)="showAddService.set(false)">Cancel</button>
              <button class="btn btn--primary" (click)="addService()">Add Service</button>
            </div>
          </div>
        </div>
      }

      <!-- Logout Modal -->
      @if (showLogoutModal()) {
        <div class="modal-overlay" (click)="showLogoutModal.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3 class="modal-title">We'll miss you!</h3>
            <p class="modal-text">Are you sure you want to logout?</p>
            <div class="modal-actions">
              <button class="btn btn--ghost" (click)="showLogoutModal.set(false)">Stay</button>
              <button class="btn btn--danger" (click)="logout()">Logout</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-page { padding: 16px; }
    .page-title {
      font-size: 22px; font-weight: 800; color: #fff;
      margin: 0 0 20px; text-transform: uppercase; letter-spacing: 1px;
    }
    .card {
      background: #111; border: 1px solid #222; border-radius: 12px;
      padding: 20px; margin-bottom: 16px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .card-title {
      font-size: 14px; font-weight: 700; color: #888;
      margin: 0; text-transform: uppercase; letter-spacing: 1px;
    }
    .add-service-btn {
      padding: 6px 12px;
      background: linear-gradient(90deg, #00bfa6, #00796b);
      color: #000;
      font-size: 11px;
      font-weight: 700;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .empty-state {
      text-align: center;
      padding: 24px;
      color: #666;
      font-size: 14px;
    }
    .service-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #0a0a0a;
      border: 1px solid #222;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .service-item.inactive {
      opacity: 0.5;
    }
    .service-info {
      flex: 1;
      min-width: 0;
    }
    .service-name {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 4px;
    }
    .service-desc {
      font-size: 13px;
      color: #888;
      margin: 0 0 6px;
    }
    .service-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #666;
    }
    .service-meta .price {
      color: #00bfa6;
      font-weight: 600;
    }
    .service-meta .divider {
      color: #444;
    }
    .inactive-badge {
      padding: 2px 6px;
      background: #222;
      color: #888;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .toggle-btn {
      padding: 6px 12px;
      background: transparent;
      border: 1px solid #333;
      color: #888;
      font-size: 11px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      text-transform: uppercase;
    }
    .toggle-btn:hover {
      border-color: #00bfa6;
      color: #00bfa6;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .modal--wide {
      max-width: 500px;
    }
    .form-group { margin-bottom: 12px; }
    .form-label {
      display: block; font-size: 11px; font-weight: 700; color: #666;
      text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;
    }
    .form-input {
      width: 100%; padding: 10px; background: #0a0a0a;
      border: 1px solid #333; border-radius: 6px; color: #fff;
      font-size: 14px; font-family: inherit; outline: none; box-sizing: border-box;
    }
    .form-input:focus { border-color: #00bfa6; }
    .form-input:disabled { color: #555; cursor: not-allowed; }
    .form-textarea { resize: vertical; min-height: 80px; }
    .save-btn {
      width: 100%; padding: 10px; background: linear-gradient(90deg, #00bfa6, #00796b);
      color: #000; font-size: 13px; font-weight: 700; border: none; border-radius: 8px;
      cursor: pointer; font-family: inherit; text-transform: uppercase; letter-spacing: 0.5px;
      margin-top: 4px;
    }
    .kyc-status {
      padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;
      margin-bottom: 12px; text-align: center;
    }
    .kyc-status[data-status="pending"] { background: #332b00; color: #ffc107; }
    .kyc-status[data-status="verified"] { background: #0a2a0a; color: #66bb6a; }
    .kyc-status[data-status="rejected"] { background: #2a0a0a; color: #ef5350; }
    .kyc-status[data-status="not_submitted"] { background: #1a1a1a; color: #888; }
    .logout-btn {
      width: 100%; padding: 12px; background: transparent;
      border: 1px solid #ef5350; color: #ef5350; border-radius: 8px;
      font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8);
      display: flex; align-items: center; justify-content: center; z-index: 200;
      padding: 16px; animation: fadeIn 200ms ease;
    }
    .modal {
      background: #111; border: 1px solid #333; border-radius: 12px;
      padding: 24px; max-width: 340px; width: 100%;
    }
    .modal-title { font-size: 18px; font-weight: 800; color: #fff; margin: 0 0 8px; }
    .modal-text { font-size: 14px; color: #888; margin: 0 0 20px; }
    .modal-actions { display: flex; gap: 8px; }
    .btn {
      flex: 1; padding: 10px; border-radius: 8px; font-size: 14px;
      font-weight: 700; font-family: inherit; cursor: pointer; border: none;
      text-transform: uppercase;
    }
    .btn--ghost { background: transparent; border: 1px solid #333; color: #ccc; }
    .btn--danger { background: #ef5350; color: #fff; }
    .skeleton-card { background: #111; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    .skeleton-line { height: 14px; background: #222; border-radius: 4px; margin-bottom: 8px; animation: shimmer 1.2s ease-in-out infinite; }
    .w80 { width: 80%; }
    .w60 { width: 60%; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
  `],
})
export class VendorProfileComponent implements OnInit {
  profile: any = {};
  vendorProfile: any = { business_name: '', bio: '', service_radius_km: 10 };
  kycStatus = signal('not_submitted');
  loading = signal(true);
  showLogoutModal = signal(false);
  docType = 'aadhaar';
  docNumber = '';

  // Service Management
  services = signal<any[]>([]);
  categories = signal<any[]>([]);
  showAddService = signal(false);
  newService = {
    category_id: '',
    name: '',
    description: '',
    base_price: 0,
    duration_minutes: 60,
  };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.loadCategories();
    this.loadServices();
    this.api.getProfile().subscribe({
      next: (res: any) => {
        const data = res.data;
        this.profile = {
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
        };
        this.vendorProfile = {
          business_name: data.vendor_profile?.business_name || '',
          bio: data.vendor_profile?.bio || '',
          service_radius_km: data.vendor_profile?.service_radius_km || 10,
        };
        this.kycStatus.set(data.vendor_profile?.kyc_status || 'not_submitted');
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadCategories() {
    this.api.getCategories().subscribe({
      next: (res: any) => {
        this.categories.set(res.data || []);
      },
    });
  }

  loadServices() {
    this.api.getVendorServices().subscribe({
      next: (res: any) => {
        this.services.set(res.data || []);
      },
      error: (err: any) => console.error('Failed to load services', err),
    });
  }

  addService() {
    if (!this.newService.name || !this.newService.category_id || !this.newService.base_price) {
      this.toast.show('Fill in all required fields', 'error');
      return;
    }

    this.api.addVendorService(this.newService).subscribe({
      next: () => {
        this.toast.show('Service added successfully', 'success');
        this.showAddService.set(false);
        this.newService = {
          category_id: '',
          name: '',
          description: '',
          base_price: 0,
          duration_minutes: 60,
        };
        this.loadServices();
      },
      error: (err: any) => this.toast.show(err.error?.message || 'Failed to add service', 'error'),
    });
  }

  toggleService(service: any) {
    const newStatus = !service.is_active;
    this.api.updateVendorService(service.id, { is_active: newStatus }).subscribe({
      next: () => {
        service.is_active = newStatus;
        this.toast.show(`Service ${newStatus ? 'activated' : 'deactivated'}`, 'success');
      },
      error: (err: any) => this.toast.show(err.error?.message || 'Failed to update service', 'error'),
    });
  }

  saveProfile() {
    this.api.updateProfile(this.profile).subscribe({
      next: () => this.toast.show('Profile updated', 'success'),
      error: (err: any) => this.toast.show(err.error?.message || 'Failed', 'error'),
    });
  }

  saveVendorProfile() {
    this.api.updateVendorProfile(this.vendorProfile).subscribe({
      next: () => this.toast.show('Business info updated', 'success'),
      error: (err: any) => this.toast.show(err.error?.message || 'Failed', 'error'),
    });
  }

  uploadDoc() {
    if (!this.docNumber.trim()) {
      this.toast.show('Enter document number', 'error');
      return;
    }
    this.api.uploadDocument({
      document_type: this.docType,
      document_number: this.docNumber,
    }).subscribe({
      next: () => {
        this.toast.show('Document submitted for review', 'success');
        this.kycStatus.set('pending');
        this.docNumber = '';
      },
      error: (err: any) => this.toast.show(err.error?.message || 'Failed', 'error'),
    });
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => this.router.navigate(['/auth/login']),
    });
  }
}
