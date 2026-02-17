import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TenantAuthModalComponent } from '../components/tenant-auth-modal/tenant-auth-modal.component';

@Injectable({ providedIn: 'root' })
export class TenantAuthModalService {
  private readonly dialog = inject(MatDialog);

  open(
    initialTab: 'login' | 'register' = 'login'
  ): MatDialogRef<TenantAuthModalComponent> {
    const dialogRef = this.dialog.open(TenantAuthModalComponent, {
      width: '560px',
      maxWidth: '95vw',
      autoFocus: false,
      panelClass: 'tenant-auth-modal-panel',
      disableClose: false,
    });

    dialogRef.componentInstance.selectTab(initialTab);
    return dialogRef;
  }
}
