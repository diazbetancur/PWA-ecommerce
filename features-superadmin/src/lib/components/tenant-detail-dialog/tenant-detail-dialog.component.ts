/**
 * 🔍 Diálogo de Detalles del Tenant
 */

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { TenantDetail } from '../../models/tenant.model';
import { TenantAdminService } from '../../services/tenant-admin.service';

interface TenantDetailDialogData {
  tenantId: string;
}

@Component({
  selector: 'lib-tenant-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './tenant-detail-dialog.component.html',
  styleUrl: './tenant-detail-dialog.component.scss',
})
export class TenantDetailDialogComponent implements OnInit {
  private readonly tenantService = inject(TenantAdminService);
  private readonly dialogRef = inject(MatDialogRef<TenantDetailDialogComponent>);
  private readonly data = inject<TenantDetailDialogData>(MAT_DIALOG_DATA);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly tenant = signal<TenantDetail | null>(null);

  ngOnInit(): void {
    void this.loadTenantDetails();
  }

  private async loadTenantDetails(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const details = await this.tenantService.getTenantById(this.data.tenantId);
      this.tenant.set(details);
    } catch (err: unknown) {
      this.error.set('Error al cargar los detalles del comercio');
    } finally {
      this.isLoading.set(false);
    }
  }

  getFeatureFlags(): { key: string; value: boolean }[] {
    const tenant = this.tenant();
    if (!tenant?.featureFlagsJson) return [];

    try {
      const flags = JSON.parse(tenant.featureFlagsJson);
      return Object.entries(flags).map(([key, value]) => ({
        key,
        value: value as boolean,
      }));
    } catch {
      return [];
    }
  }

  getAllowedOriginsList(): string[] {
    const tenant = this.tenant();
    if (!tenant?.allowedOrigins) return [];
    return tenant.allowedOrigins.split(',').map(o => o.trim());
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getStepStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'check_circle';
      case 'failed':
        return 'error';
      case 'inprogress':
        return 'schedule';
      default:
        return 'info';
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
