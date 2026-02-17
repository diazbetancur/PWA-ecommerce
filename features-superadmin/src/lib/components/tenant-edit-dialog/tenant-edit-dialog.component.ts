/**
 * ✏️ Diálogo de Edición del Tenant
 */

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Plan, TenantDetail } from '../../models/tenant.model';
import { TenantAdminService } from '../../services/tenant-admin.service';

interface TenantEditDialogData {
  tenantId: string;
}

@Component({
  selector: 'lib-tenant-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './tenant-edit-dialog.component.html',
  styleUrl: './tenant-edit-dialog.component.scss',
})
export class TenantEditDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tenantService = inject(TenantAdminService);
  private readonly dialogRef = inject(MatDialogRef<TenantEditDialogComponent>);
  private readonly data = inject<TenantEditDialogData>(MAT_DIALOG_DATA);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);
  readonly tenant = signal<TenantDetail | null>(null);
  readonly plans = signal<Plan[]>([]);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    planId: ['', Validators.required],
    allowedOrigins: [''],
    featureFlagsJson: [''],
  });

  ngOnInit(): void {
    void this.loadData();
  }

  private async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Cargar planes y detalles del tenant en paralelo
      const [tenant, plans] = await Promise.all([
        this.tenantService.getTenantById(this.data.tenantId),
        this.tenantService.getPlans(),
      ]);

      this.tenant.set(tenant);
      this.plans.set(plans);

      // Rellenar el formulario
      this.form.patchValue({
        name: tenant.name,
        planId: tenant.planId,
        allowedOrigins: tenant.allowedOrigins || '',
        featureFlagsJson: tenant.featureFlagsJson || '',
      });
    } catch (err: unknown) {
      console.error('Error al cargar datos:', err);
      this.error.set('Error al cargar los datos del comercio');
    } finally {
      this.isLoading.set(false);
    }
  }

  hasChanges(): boolean {
    const tenant = this.tenant();
    if (!tenant) return false;
    
    const formValue = this.form.value;

    return (
      formValue.name !== tenant.name ||
      formValue.planId !== tenant.planId ||
      formValue.allowedOrigins !== (tenant.allowedOrigins || '') ||
      formValue.featureFlagsJson !== (tenant.featureFlagsJson || '')
    );
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || !this.hasChanges()) return;

    this.isSaving.set(true);
    this.error.set(null);

    try {
      const formValue = this.form.value;
      
      if (!formValue.name || !formValue.planId) {
        this.error.set('Datos de formulario incompletos');
        return;
      }

      const updateData = {
        name: formValue.name,
        planId: formValue.planId,
        allowedOrigins: formValue.allowedOrigins || undefined,
        featureFlagsJson: formValue.featureFlagsJson || undefined,
      };

      await this.tenantService.updateTenant(this.data.tenantId, updateData);
      this.dialogRef.close(true);
    } catch (err: unknown) {
      console.error('Error al actualizar tenant:', err);
      this.error.set('Error al actualizar el comercio. Inténtelo nuevamente.');
    } finally {
      this.isSaving.set(false);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
