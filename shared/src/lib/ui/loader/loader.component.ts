import { Component, Input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'lib-loader',
  standalone: true,
  imports: [MatProgressBarModule],
  template: `
    <mat-progress-bar
      *ngIf="active"
      mode="indeterminate"
      aria-label="Loading"
    ></mat-progress-bar>
  `,
})
export class LoaderComponent {
  @Input() active = false;
}
