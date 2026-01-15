import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  FooterComponent,
  HeaderComponent,
  WhatsappButtonComponent,
} from '../../ui';
import { ToastContainerComponent } from '../../ui/toast-container/toast-container.component';

@Component({
  selector: 'lib-public-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    WhatsappButtonComponent,
    ToastContainerComponent,
  ],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
})
export class PublicLayoutComponent {}
