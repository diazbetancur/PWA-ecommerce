import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PointsAdjustment } from '../../../../models/loyalty.models';

@Component({
  selector: 'lib-loyalty-adjustment-detail-modal',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './loyalty-adjustment-detail-modal.component.html',
  styleUrl: './loyalty-adjustment-detail-modal.component.scss',
})
export class LoyaltyAdjustmentDetailModalComponent {
  @Input() adjustment: PointsAdjustment | null = null;
  @Output() closeModal = new EventEmitter<void>();

  close(): void {
    this.closeModal.emit();
  }
}
