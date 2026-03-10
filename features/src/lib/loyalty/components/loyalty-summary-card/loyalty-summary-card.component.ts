import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'lib-loyalty-summary-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article
      class="summary-card"
      [class.summary-card--primary]="variant() === 'primary'"
      [class.summary-card--secondary]="variant() === 'secondary'"
    >
      <div class="summary-card__label">{{ title() }}</div>
      <div class="summary-card__value">{{ value() | number : '1.0-0' }}</div>
      @if (subtitle()) {
      <p class="summary-card__subtitle">{{ subtitle() }}</p>
      }
    </article>
  `,
  styles: [
    `
      .summary-card {
        border: 1px solid #e6ebf1;
        border-radius: 16px;
        background: #fff;
        padding: 1rem;
        min-height: 150px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
      }

      .summary-card--primary {
        background: linear-gradient(
          135deg,
          var(--primary-color, var(--tenant-primary-color, #007bff)),
          color-mix(
            in srgb,
            var(--primary-color, var(--tenant-primary-color, #007bff)) 75%,
            #000 25%
          )
        );
        color: #fff;
        border-color: transparent;
      }

      .summary-card--secondary {
        background: linear-gradient(
          135deg,
          var(--secondary-color, var(--tenant-secondary-color, #64748b)),
          color-mix(
            in srgb,
            var(--secondary-color, var(--tenant-secondary-color, #64748b)) 75%,
            #000 25%
          )
        );
        color: #fff;
        border-color: transparent;
      }

      .summary-card__label {
        font-size: 0.95rem;
        font-weight: 600;
      }

      .summary-card__value {
        font-size: clamp(1.6rem, 3vw, 2.2rem);
        font-weight: 800;
        margin: 0.4rem 0;
      }

      .summary-card__subtitle {
        margin: 0;
        font-size: 0.82rem;
        opacity: 0.85;
      }
    `,
  ],
})
export class LoyaltySummaryCardComponent {
  title = input.required<string>();
  value = input.required<number>();
  subtitle = input<string>('');
  variant = input<'primary' | 'secondary'>('primary');
}
