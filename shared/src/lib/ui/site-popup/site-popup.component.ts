import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

export interface SitePopupData {
  id: string;
  imageUrl: string;
  targetUrl?: string | null;
  buttonText?: string | null;
}

@Component({
  selector: 'app-site-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './site-popup.component.html',
  styleUrls: ['./site-popup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SitePopupComponent {
  @Input() popup: SitePopupData | null = null;
  @Input() visible = false;

  @Output() closed = new EventEmitter<void>();

  onClose(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
