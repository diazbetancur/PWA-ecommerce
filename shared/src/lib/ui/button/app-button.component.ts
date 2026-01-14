import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './app-button.component.html',
  styleUrl: './app-button.component.scss',
})
export class AppButtonComponent {
  // Inputs
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  loading = input<boolean>(false);
  disabled = input<boolean>(false);
  icon = input<string | undefined>();
  iconPosition = input<'left' | 'right'>('left');
  fullWidth = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');

  // Output
  clicked = output<MouseEvent>();

  // Computed
  isDisabled = computed(() => this.disabled() || this.loading());
  showIcon = computed(() => this.icon() && !this.loading());
  buttonClasses = computed(() => {
    return [
      'app-button',
      `app-button--${this.variant()}`,
      `app-button--${this.size()}`,
      this.fullWidth() ? 'app-button--full-width' : '',
      this.loading() ? 'app-button--loading' : '',
    ]
      .filter(Boolean)
      .join(' ');
  });

  onClick(event: MouseEvent): void {
    if (!this.isDisabled()) {
      this.clicked.emit(event);
    }
  }
}
