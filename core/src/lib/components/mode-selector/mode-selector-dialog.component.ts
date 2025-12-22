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
  template: `
    <div class="mode-selector-dialog">
      <h2 mat-dialog-title>
        <mat-icon>swap_horiz</mat-icon>
        ¿Cómo deseas continuar?
      </h2>

      <mat-dialog-content>
        <p class="subtitle">
          Tu cuenta tiene acceso a múltiples áreas. Selecciona cómo quieres
          navegar:
        </p>

        <div class="mode-cards">
          <!-- Opción Cliente -->
          <mat-card
            class="mode-card customer-card"
            (click)="selectMode('customer')"
          >
            <mat-card-header>
              <mat-icon class="mode-icon">shopping_bag</mat-icon>
              <mat-card-title>Como Cliente</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <ul>
                <li>Explorar productos</li>
                <li>Ver categorías</li>
                <li>Realizar compras</li>
                <li>Gestionar pedidos</li>
              </ul>
            </mat-card-content>
          </mat-card>

          <!-- Opción Empleado -->
          <mat-card
            class="mode-card employee-card"
            (click)="selectMode('employee')"
          >
            <mat-card-header>
              <mat-icon class="mode-icon">work</mat-icon>
              <mat-card-title>Como Empleado</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <ul>
                <li>Administrar productos</li>
                <li>Gestionar categorías</li>
                <li>Configurar banners</li>
                <li>Acceso administrativo</li>
              </ul>
            </mat-card-content>
          </mat-card>
        </div>

        <p class="hint">
          <mat-icon>info</mat-icon>
          Podrás cambiar de modo más tarde desde tu perfil
        </p>
      </mat-dialog-content>
    </div>
  `,
  styles: [
    `
      .mode-selector-dialog {
        padding: 1rem;
        max-width: 600px;
      }

      h2 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #1976d2;
        margin: 0 0 1rem;

        mat-icon {
          font-size: 2rem;
          width: 2rem;
          height: 2rem;
        }
      }

      .subtitle {
        color: rgba(0, 0, 0, 0.7);
        margin: 0 0 1.5rem;
        text-align: center;
      }

      .mode-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .mode-card {
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid transparent;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }

        mat-card-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem 0;
        }

        .mode-icon {
          font-size: 3rem;
          width: 3rem;
          height: 3rem;
          margin-bottom: 0.5rem;
        }

        mat-card-title {
          font-size: 1.25rem;
          font-weight: 500;
          text-align: center;
        }

        mat-card-content {
          padding: 1rem;

          ul {
            list-style: none;
            padding: 0;
            margin: 0;

            li {
              padding: 0.5rem 0;
              display: flex;
              align-items: center;
              font-size: 0.875rem;
              color: rgba(0, 0, 0, 0.7);

              &::before {
                content: '✓';
                margin-right: 0.5rem;
                font-weight: bold;
              }
            }
          }
        }
      }

      .customer-card {
        border-color: #4caf50;

        &:hover {
          border-color: #4caf50;
          background-color: #f1f8f4;
        }

        .mode-icon {
          color: #4caf50;
        }

        mat-card-content ul li::before {
          color: #4caf50;
        }
      }

      .employee-card {
        border-color: #2196f3;

        &:hover {
          border-color: #2196f3;
          background-color: #e3f2fd;
        }

        .mode-icon {
          color: #2196f3;
        }

        mat-card-content ul li::before {
          color: #2196f3;
        }
      }

      .hint {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background-color: #f5f5f5;
        border-radius: 4px;
        font-size: 0.875rem;
        color: rgba(0, 0, 0, 0.6);
        margin: 0;

        mat-icon {
          font-size: 1.25rem;
          width: 1.25rem;
          height: 1.25rem;
        }
      }

      @media (max-width: 600px) {
        .mode-cards {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
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
