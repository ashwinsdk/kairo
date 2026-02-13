import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-kyc-verification',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="kyc-page">
      <h1 class="page-title">KYC Verification</h1>

      <!-- Tabs -->
      <div class="tabs">
        @for (tab of tabs; track tab.key) {
          <button class="tab" [class.active]="activeTab() === tab.key" (click)="setTab(tab.key)">
            {{ tab.label }}
            @if (tab.count) {
              <span class="tab-count">{{ tab.count() }}</span>
            }
          </button>
        }
      </div>

      @if (loading()) {
        @for (i of [1,2,3]; track i) {
          <div class="kyc-card skeleton">
            <div class="skeleton-line w80"></div>
            <div class="skeleton-line w60"></div>
          </div>
        }
      }

      @for (vendor of filteredVendors(); track vendor.id) {
        <div class="kyc-card">
          <div class="kyc-header">
            <div>
              <h3 class="kyc-name">{{ vendor.business_name || vendor.name }}</h3>
              <p class="kyc-email">{{ vendor.email }}</p>
            </div>
            <span class="kyc-status" [attr.data-status]="vendor.kyc_status">
              {{ vendor.kyc_status | titlecase }}
            </span>
          </div>
          @if (vendor.documents && vendor.documents.length > 0) {
            <div class="doc-list">
              @for (doc of vendor.documents; track doc.id) {
                <div class="doc-item">
                  <span class="doc-type">{{ doc.document_type | titlecase }}</span>
                  <span class="doc-number">{{ doc.document_number }}</span>
                </div>
              }
            </div>
          }
          @if (vendor.kyc_status === 'pending') {
            <div class="kyc-actions">
              <button class="btn btn--approve" (click)="updateKyc(vendor.id, 'verified')">Approve</button>
              <button class="btn btn--reject" (click)="updateKyc(vendor.id, 'rejected')">Reject</button>
            </div>
          }
        </div>
      }

      @if (!loading() && filteredVendors().length === 0) {
        <div class="empty"><p>No {{ activeTab() }} KYC submissions</p></div>
      }
    </div>
  `,
    styles: [`
    .kyc-page { }
    .page-title {
      font-size: 24px; font-weight: 800; color: #fff;
      margin: 0 0 20px; text-transform: uppercase; letter-spacing: 1px;
    }
    .tabs {
      display: flex; gap: 0; margin-bottom: 16px;
      border: 1px solid #333; border-radius: 8px; overflow: hidden;
    }
    .tab {
      flex: 1; padding: 10px; background: transparent; border: none;
      color: #888; font-size: 13px; font-weight: 600; cursor: pointer;
      font-family: inherit; text-transform: uppercase; letter-spacing: 0.5px;
      transition: all 200ms; display: flex; align-items: center;
      justify-content: center; gap: 6px;
    }
    .tab.active { background: linear-gradient(90deg, #00bfa6, #00796b); color: #000; }
    .tab-count {
      width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.2);
      font-size: 11px; display: flex; align-items: center; justify-content: center;
    }
    .tab.active .tab-count { background: rgba(0,0,0,0.2); }

    .kyc-card {
      background: #111; border: 1px solid #222; border-radius: 8px;
      padding: 16px; margin-bottom: 8px;
    }
    .kyc-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 8px;
    }
    .kyc-name { font-size: 15px; font-weight: 700; color: #fff; margin: 0 0 2px; }
    .kyc-email { font-size: 12px; color: #666; margin: 0; }
    .kyc-status {
      font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .kyc-status[data-status="pending"] { background: #332b00; color: #ffc107; }
    .kyc-status[data-status="verified"] { background: #0a2a0a; color: #66bb6a; }
    .kyc-status[data-status="rejected"] { background: #2a0a0a; color: #ef5350; }

    .doc-list { margin-bottom: 12px; }
    .doc-item {
      display: flex; justify-content: space-between; padding: 6px 0;
      border-bottom: 1px solid #1a1a1a; font-size: 13px;
    }
    .doc-type { color: #888; }
    .doc-number { color: #ccc; font-family: 'Source Code Pro', monospace; }

    .kyc-actions { display: flex; gap: 8px; }
    .btn {
      flex: 1; padding: 8px; border-radius: 6px; font-size: 13px;
      font-weight: 700; cursor: pointer; border: none; font-family: inherit;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .btn--approve { background: linear-gradient(90deg, #00bfa6, #00796b); color: #000; }
    .btn--reject { background: transparent; border: 1px solid #ef5350; color: #ef5350; }

    .empty { text-align: center; padding: 32px; color: #555; }
    .empty p { margin: 0; font-size: 14px; }
    .skeleton { pointer-events: none; }
    .skeleton-line { height: 14px; background: #222; border-radius: 4px; margin-bottom: 8px; animation: shimmer 1.2s ease-in-out infinite; }
    .w80 { width: 80%; }
    .w60 { width: 60%; }
    @keyframes shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
  `],
})
export class KycVerificationComponent implements OnInit {
    allVendors = signal<any[]>([]);
    loading = signal(true);
    activeTab = signal('pending');
    pendingCount = signal(0);

    tabs: any[];

    constructor(
        private api: ApiService,
        private toast: ToastService,
    ) {
        this.tabs = [
            { key: 'pending', label: 'Pending', count: this.pendingCount },
            { key: 'verified', label: 'Verified' },
            { key: 'rejected', label: 'Rejected' },
        ];
    }

    ngOnInit() {
        this.loadKyc();
    }

    setTab(key: string) {
        this.activeTab.set(key);
    }

    filteredVendors(): any[] {
        return this.allVendors().filter(v => v.kyc_status === this.activeTab());
    }

    private loadKyc() {
        this.api.getKycList().subscribe({
            next: (res: any) => {
                const vendors = res.data || [];
                this.allVendors.set(vendors);
                this.pendingCount.set(vendors.filter((v: any) => v.kyc_status === 'pending').length);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    updateKyc(vendorId: number, status: string) {
        this.api.updateKyc(vendorId, { status }).subscribe({
            next: () => {
                this.toast.show(`KYC ${status}`, 'success');
                this.loadKyc();
            },
            error: (err: any) => this.toast.show(err.error?.message || 'Failed', 'error'),
        });
    }
}
