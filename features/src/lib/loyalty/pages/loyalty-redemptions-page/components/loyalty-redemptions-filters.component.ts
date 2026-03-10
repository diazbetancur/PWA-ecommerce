import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { LoyaltyRedemptionsFilters } from '../../../models/loyalty.models';

@Component({
  selector: 'lib-loyalty-redemptions-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './loyalty-redemptions-filters.component.html',
  styleUrl: './loyalty-redemptions-filters.component.scss',
})
export class LoyaltyRedemptionsFiltersComponent {
  private readonly fb = inject(FormBuilder);

  @Output() applyFilters = new EventEmitter<
    Pick<LoyaltyRedemptionsFilters, 'status' | 'fromDate' | 'toDate'>
  >();

  readonly dateError = signal<string | null>(null);

  readonly filtersForm = this.fb.group({
    status: [''],
    fromDate: [''],
    toDate: [''],
  });

  apply(): void {
    this.dateError.set(null);

    const raw = this.filtersForm.getRawValue();
    const parsedFrom = this.parseNativeDate(raw.fromDate || '');
    const parsedTo = this.parseNativeDate(raw.toDate || '');

    if ((raw.fromDate && !parsedFrom) || (raw.toDate && !parsedTo)) {
      this.dateError.set('Selecciona fechas válidas.');
      return;
    }

    if (parsedFrom && parsedTo && parsedFrom > parsedTo) {
      this.dateError.set('La fecha desde no puede ser mayor a la fecha hasta.');
      return;
    }

    this.applyFilters.emit({
      status: raw.status || undefined,
      fromDate: parsedFrom ? this.toBackendDate(parsedFrom, false) : undefined,
      toDate: parsedTo ? this.toBackendDate(parsedTo, true) : undefined,
    });
  }

  clear(): void {
    this.filtersForm.reset({
      status: '',
      fromDate: '',
      toDate: '',
    });
    this.dateError.set(null);
    this.applyFilters.emit({});
  }

  private parseNativeDate(value: string): Date | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    const isValid =
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;

    return isValid ? date : null;
  }

  private toBackendDate(date: Date, endOfDay: boolean): string {
    const yyyy = date.getUTCFullYear();
    const mm = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const dd = `${date.getUTCDate()}`.padStart(2, '0');
    const hhmmss = endOfDay ? '23:59:59' : '00:00:00';
    return `${yyyy}-${mm}-${dd}T${hhmmss}Z`;
  }
}
