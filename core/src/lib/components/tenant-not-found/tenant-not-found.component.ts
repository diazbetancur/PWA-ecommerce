import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Componente que se muestra cuando no se encuentra un tenant
 */
@Component({
  selector: 'app-tenant-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tenant-not-found.component.html',
  styleUrl: './tenant-not-found.component.scss',
})
export class TenantNotFoundComponent {}
