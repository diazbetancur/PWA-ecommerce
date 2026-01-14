/**
 * 🎭 Componente de Selección de Modo
 *
 * Modal que aparece cuando el usuario tiene múltiples roles (Customer + otros)
 * para que elija si quiere navegar como Cliente o como Empleado.
 */

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { UserModeService } from '../../services/user-mode.service';

@Component({
  selector: 'lib-mode-selector-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './mode-selector-dialog.component.html',
  styleUrl: './mode-selector-dialog.component.scss',
})
export class ModeSelectorDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<ModeSelectorDialogComponent>
  );
  private readonly userModeService = inject(UserModeService);
  private readonly router = inject(Router);

  selectMode(mode: 'customer' | 'employee'): void {
    this.userModeService.setMode(mode);
    this.dialogRef.close(mode);

    // Redirigir según el modo seleccionado
    if (mode === 'employee') {
      this.router.navigate(['/tenant-admin']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
