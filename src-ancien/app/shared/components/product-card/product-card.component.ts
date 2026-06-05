import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { BadgeComponent } from '../../ui/badge/badge.component';
import { formatCurrency } from '@app/core/utils';

export interface ProductCard {
  id: number;
  name: string;
  reference: string;
  price: number;
  imageUrl?: string;
  hasCombinations: boolean;
  badge?: 'hot' | 'new' | null;
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage, BadgeComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  product = input.required<ProductCard>();

  formatPrice(price: number): string {
    return formatCurrency(price, 0);
  }
}
