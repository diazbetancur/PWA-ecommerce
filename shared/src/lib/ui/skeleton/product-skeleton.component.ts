import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-product-card-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-skeleton.component.html',
  styleUrl: './product-card-skeleton.component.scss',
})
export class ProductCardSkeletonComponent {}

@Component({
  selector: 'app-products-grid-skeleton',
  standalone: true,
  imports: [CommonModule, ProductCardSkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './products-grid-skeleton.component.html',
  styleUrl: './products-grid-skeleton.component.scss',
})
export class ProductsGridSkeletonComponent {
  readonly count = input<number>(12);

  get skeletonItems(): number[] {
    return new Array(this.count()).fill(0);
  }
}
