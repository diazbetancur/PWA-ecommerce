import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
})
export class SearchInputComponent {
  // Two-way binding con model signal
  value = model<string>('');

  // Inputs
  placeholder = input<string>('Buscar...');
  label = input<string>('Buscar');
  disabled = input<boolean>(false);
  autofocus = input<boolean>(false);

  // Outputs
  searched = output<string>();
  cleared = output<void>();

  onClear(): void {
    this.value.set('');
    this.cleared.emit();
  }

  onSearch(): void {
    this.searched.emit(this.value());
  }
}
