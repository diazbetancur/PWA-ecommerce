import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from './confirmation-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class ConfirmationDialogService {
  private readonly dialog = inject(MatDialog);

  /**
   * Abre un diálogo de confirmación
   * @returns Observable<boolean> - true si confirma, false si cancela
   */
  confirm(data: ConfirmationDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data,
      width: '440px',
      maxWidth: '90vw',
      panelClass: 'confirmation-dialog-container',
      autoFocus: false,
      restoreFocus: true,
    });

    return dialogRef.afterClosed();
  }

  /**
   * Shortcut para confirmación de eliminación
   */
  confirmDelete(
    itemName: string,
    additionalMessage?: string
  ): Observable<boolean> {
    return this.confirm({
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar "${itemName}"?${
        additionalMessage ? '\n\n' + additionalMessage : ''
      }`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete_forever',
    });
  }

  /**
   * Shortcut para advertencia genérica
   */
  confirmWarning(title: string, message: string): Observable<boolean> {
    return this.confirm({
      title,
      message,
      confirmText: 'Continuar',
      cancelText: 'Cancelar',
      type: 'warning',
    });
  }
}
