import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartService, CartItem } from '../cart/cart.service';
import { StoreCheckoutService } from '../services/store-checkout.service';
import { UserSessionService } from '../services/user-session.service';
import { StockAvailableService } from '@app/core/services';
import { formatCurrency, psLang } from '@app/core/utils';
import { firstValueFrom } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,

  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly checkout = inject(StoreCheckoutService);
  private readonly session = inject(UserSessionService);
  private readonly stockAvailable = inject(StockAvailableService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly cart = this.cartService.cart;
  readonly totalHt = this.cartService.totalHt;
  readonly totalTtc = this.cartService.totalTtc;
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly currentUser = this.session.currentUser;
  /** A real PrestaShop customer must be selected to place an order. */
  readonly hasCustomer = computed(() => {
    const user = this.currentUser();
    return !!user && user.id > 0;
  });

  readonly checkoutForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    phone: [''],
    city: ['', Validators.required],
  });

  ngOnInit(): void {
    const user = this.currentUser();
    if (user) {
      this.checkoutForm.patchValue({ fullName: user.name, city: user.city });
    }
  }

  formatPrice(n: number): string {
    return formatCurrency(n, 2);
  }

  formatLineTotalHt(item: CartItem): string {
    return this.formatPrice(this.cartService.lineHt(item));
  }

  formatLineTotalTtc(item: CartItem): string {
    return this.formatPrice(this.cartService.lineTtc(item));
  }

  async submit(): Promise<void> {
    this.error.set(null);

    const user = this.currentUser();
    if (!user || user.id === 0) {
      this.error.set('Veuillez sélectionner un client avant de valider la commande.');
      return;
    }
    if (this.checkoutForm.invalid) {
      this.error.set('Veuillez remplir votre nom et votre ville.');
      return;
    }
    if (!this.cart().length) {
      this.error.set('Votre panier est vide.');
      return;
    }

    // Validate stock availability
    const stockError = await this.validateStockAvailability();
    if (stockError) {
      this.error.set(stockError);
      return;
    }

    this.submitting.set(true);
    const { fullName, phone, city } = this.checkoutForm.getRawValue();

    this.checkout
      .placeOrder({
        idCustomer: user.id,
        fullName: fullName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        items: this.cart(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orderId) => {
          void this.cartService.deleteCart();
          this.router.navigate(['/order-confirmation', orderId]);
        },
        error: (err: unknown) => {
          this.error.set(err instanceof Error ? err.message : 'Une erreur est survenue.');
          this.submitting.set(false);
        },
      });
  }

  private async validateStockAvailability(): Promise<string | null> {
    try {
      for (const item of this.cart()) {
        const stocks = await firstValueFrom(
          this.stockAvailable.getAllFull({
            'filter[id_product]': item.product.id,
          })
        );

        const stock = stocks.find(s => s.id_product_attribute === item.combinationId);
        if (!stock || stock.quantity < item.quantity) {
          const available = stock?.quantity ?? 0;
          return `Stock insuffisant pour "${item.product.name}". Disponible: ${available}, Demandé: ${item.quantity}`;
        }
      }
      return null;
    } catch (err) {
      return null;
    }
  }
}
