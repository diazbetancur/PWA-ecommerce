/**
 * 🎭 Guard de Selección de Modo
 *
 * Intercepta la navegación después del login y muestra el popup de selección de modo
 * si el usuario tiene múltiples roles (Customer + otros) y no ha seleccionado todavía.
 */

import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CanActivateFn, Router } from '@angular/router';
import { ModeSelectorDialogComponent } from '../../components/mode-selector/mode-selector-dialog.component';
import { UserModeService } from '../../services/user-mode.service';

export const modeSelectorGuard: CanActivateFn = async () => {
  const userModeService = inject(UserModeService);
  const dialog = inject(MatDialog);
  const router = inject(Router);

  // Si debe mostrar el selector de modo
  if (userModeService.shouldShowModeSelector()) {
    // Mostrar el diálogo
    const dialogRef = dialog.open(ModeSelectorDialogComponent, {
      disableClose: true, // No permitir cerrar sin elegir
      width: '600px',
      maxWidth: '90vw',
    });

    // Esperar a que el usuario elija usando firstValueFrom en lugar de toPromise()
    const { firstValueFrom } = await import('rxjs');
    const selectedMode = await firstValueFrom(dialogRef.afterClosed());

    // Si eligió un modo, permitir la navegación
    if (selectedMode) {
      return true;
    }

    // Si canceló (no debería pasar con disableClose), redirigir al home
    router.navigate(['/']);
    return false;
  }

  // Si no necesita elegir, permitir la navegación
  return true;
};
