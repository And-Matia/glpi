import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProductCard, ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [ProductCardComponent],
  templateUrl: './product-grid.component.html',
  styleUrl: './product-grid.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGridComponent {
  products = input.required<ProductCard[]>();
}
