import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export interface LoyaltyAdjustmentsFilterValues {
  search?: string;
  fromDate?: string;
  toDate?: string;
}

@Component({
  selector: 'lib-loyalty-adjustments-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './loyalty-adjustments-filters.component.html',
  styleUrl: './loyalty-adjustments-filters.component.scss',
})
export class LoyaltyAdjustmentsFiltersComponent {
  private readonly fb = inject(FormBuilder);

  @Output() applyFilters = new EventEmitter<LoyaltyAdjustmentsFilterValues>();

  readonly dateError = signal<string | null>(null);

  readonly filtersForm = this.fb.group({
    search: ['', [Validators.email]],
    fromDate: [''],
    toDate: [''],
  });

  apply(): void {
    this.dateError.set(null);

    if (this.filtersForm.controls.search.invalid) {
      this.filtersForm.controls.search.markAsTouched();
      return;
    }

    const raw = this.filtersForm.getRawValue();
    const parsedFrom = this.parseDate(raw.fromDate || '');
    const parsedTo = this.parseDate(raw.toDate || '');

    if ((raw.fromDate && !parsedFrom) || (raw.toDate && !parsedTo)) {
      this.dateError.set('Selecciona fechas válidas en los filtros.');
      return;
    }

    if (parsedFrom && parsedTo && parsedFrom > parsedTo) {
      this.dateError.set(
        'La fecha desde no puede ser mayor que la fecha hasta.'
      );
      return;
    }

    this.applyFilters.emit({
      search: raw.search?.trim() || undefined,
      fromDate: parsedFrom ? this.toBackendDate(parsedFrom, false) : undefined,
      toDate: parsedTo ? this.toBackendDate(parsedTo, true) : undefined,
    });
  }

  clear(): void {
    this.filtersForm.reset({
      search: '',
      fromDate: '',
      toDate: '',
    });
    this.dateError.set(null);
    this.applyFilters.emit({});
  }

  private parseDate(value: string): Date | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const nativeMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (nativeMatch) {
      const year = Number(nativeMatch[1]);
      const month = Number(nativeMatch[2]);
      const day = Number(nativeMatch[3]);

      const date = new Date(Date.UTC(year, month - 1, day));
      const isValid =
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;

      return isValid ? date : null;
    }

    const legacyMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
    if (!legacyMatch) {
      return null;
    }

    const day = Number(legacyMatch[1]);
    const month = Number(legacyMatch[2]);
    const year = Number(legacyMatch[3]);

    const date = new Date(Date.UTC(year, month - 1, day));
    const isValid =
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;

    return isValid ? date : null;
  }

  private toBackendDate(date: Date, endOfDay: boolean): string {
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    const time = endOfDay ? '23:59:59' : '00:00:00';

    return `${year}-${month}-${day}T${time}Z`;
  }
}
