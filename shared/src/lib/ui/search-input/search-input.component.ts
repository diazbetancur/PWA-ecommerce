import { CommonModule } from '@angular/common';
import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
})
export class SearchInputComponent {
  placeholder = input<string>('Buscar...');
  value = signal('');
  searchChanged = output<string>();

  constructor() {
    effect(() => {
      this.searchChanged.emit(this.value());
    });
  }

  clearSearch() {
    this.value.set('');
  }
}
