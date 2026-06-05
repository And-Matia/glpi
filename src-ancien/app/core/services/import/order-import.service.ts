import { Injectable, inject } from '@angular/core';
import { Observable, of, switchMap, map, forkJoin, from, catchError } from 'rxjs';
import { OrderRow, OrderItem, ImportStats } from '../../models/import.model';
import { StockMovementWritable } from '../../models/ps/stock-movement.model';
import { parseOrderCsv, parseOrderCsvFromString } from '../../utils/csv-parser';
import { formatDate } from '../../utils/date-utils';
import { BaseImportService } from './base-import.service';
import {
  CustomerService,
  AddressService,
  CartService,
  OrderService,
  OrderHistoryService,
  OrderStateService,
  CombinationService,
  StockMovementService,
  OrderTransitionService,
} from '@app/core/services';
import {
  DEFAULT_LANG,
  DEFAULT_CURRENCY,
  DEFAULT_CARRIER,
  DEFAULT_SHOP,
  DEFAULT_SHOP_GROUP,
  DEFAULT_EMPLOYEE,
  StockMvtReason,
} from '../../constants/import.constants';
import {
  ORDER_STATE_DELIVERED,
  ORDER_STATE_PAYMENT_ACCEPTED,
  ORDER_STATE_PAYMENT_CANCELLED,
} from '../../constants/order-states.constants';
type OrderLineItem = NonNullable<
  NonNullable<
    Parameters<InstanceType<typeof OrderService>['create']>[0]['associations']
  >['order_rows']
>[number];

@Injectable({ providedIn: 'root' })
export class OrderImportService extends BaseImportService<OrderRow> {
  // CSV row type: OrderRow (imported from models)
  // PS API type: OrderLineItem (local, used for processCart)
  private readonly customerService = inject(CustomerService);
  private readonly addressService = inject(AddressService);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly orderHistoryService = inject(OrderHistoryService);
  private readonly orderStateService = inject(OrderStateService);
  private readonly combinationService = inject(CombinationService);
  private readonly stockMovementService = inject(StockMovementService);
  private readonly orderTransitionService = inject(OrderTransitionService);

  // ── Entry points ──────────────────────────────────────────────────────────

  importFile(file: File): Observable<ImportStats> {
    return from(parseOrderCsv(file)).pipe(
      switchMap(({ rows, errors: parseErrors }) =>
        this.run(rows).pipe(map((stats) => this.mergeParseErrors(stats, parseErrors))),
      ),
    );
  }

  async validateFile(file: File): Promise<string[]> {
    try {
      const { errors } = await parseOrderCsv(file);
      return errors.map((e) => `Ligne ${e.row}: ${e.error}`);
    } catch (e) {
      return [e instanceof Error ? e.message : 'Erreur inconnue'];
    }
  }

  importString(content: string): Observable<ImportStats> {
    return of(parseOrderCsvFromString(content)).pipe(
      // parseOrderCsvFromString is synchronous
      switchMap(({ rows, errors: parseErrors }) =>
        this.run(rows).pipe(map((stats) => this.mergeParseErrors(stats, parseErrors))),
      ),
    );
  }

  // ── Row handler ───────────────────────────────────────────────────────────

  protected override importRow(row: OrderRow): Observable<void> {
    return this.customerService.getOrCreate(row.email, row.nom, row.pwd).pipe(
      switchMap((idCustomer) =>
        this.processAddress(row, idCustomer).pipe(
          switchMap((idAddress) =>
            this.processCart(row.items, idAddress, idCustomer, row.date).pipe(
              switchMap(({ idCart, orderRows }) => {
                const idState = this.orderStateService.resolveByName(row.etat);
                if (idState === null) return of(void 0);

                const isNotDeliveredOrCancelled = idState !== ORDER_STATE_DELIVERED && idState !== ORDER_STATE_PAYMENT_CANCELLED;
                // A delivered order is created as "payment accepted" so the
                // delivery transition can move it to its final state without
                // conflicting with an order already in the delivered state.
                // conflicting with an order already in the delivered state.
                const creationState = isNotDeliveredOrCancelled ? idState : ORDER_STATE_PAYMENT_ACCEPTED;
                return this.processOrder(
                  row,
                  idCustomer,
                  idAddress,
                  idCart,
                  orderRows,
                  creationState,
                ).pipe(
                  switchMap((idOrder) =>
                    this.updateOrderDate(
                      idOrder,
                      row.date,
                      idCustomer,
                      idAddress,
                      idCart,
                      orderRows,
                      creationState,
                    ).pipe(
                      switchMap(() => this.applyState(idOrder, creationState, row.date)),
                      switchMap(() =>
                        isNotDeliveredOrCancelled
                          ? of(void 0)
                          : this.orderTransitionService
                              .create({
                                id_order: idOrder,
                                id_order_state: idState,
                                date_add: formatDate(new Date(row.date)),
                              })
                              .pipe(map(() => void 0)),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }

  private logStockSorties(
    orderRows: { product_id: number; product_attribute_id: number; product_quantity: number }[],
    date: string,
  ): Observable<void> {
    return forkJoin(
      orderRows.map((r) => {
        const payload: StockMovementWritable = {
          id_stock: 1,
          id_stock_mvt_reason: StockMvtReason.SORTIE_COMMANDE,
          id_employee: DEFAULT_EMPLOYEE,
          id_product: r.product_id,
          id_product_attribute: r.product_attribute_id,
          id_warehouse: null,
          id_currency: null,
          id_order: null,
          id_supply_order: null,
          management_type: '',
          product_name: [],
          ean13: '',
          upc: '',
          reference: '',
          mpn: '',
          physical_quantity: r.product_quantity,
          sign: -1,
          last_wa: '0',
          current_wa: '0',
          price_te: '0',
          date_add: date,
        };
        return this.stockMovementService.create(payload);
      }),
    ).pipe(
      map(() => void 0),
      catchError(() => of(void 0)),
    );
  }

  private processAddress(row: OrderRow, idCustomer: number): Observable<number> {
    return this.addressService.getOrCreate(idCustomer, row.adresse, row.nom);
  }

  private processCart(
    items: OrderItem[],
    idAddress: number,
    idCustomer: number,
    date: string,
  ): Observable<{ idCart: number; orderRows: OrderLineItem[] }> {
    // Consolidate items: combine duplicate products by summing quantities
    // Key: reference + variant (to handle same product with different variants separately)
    const consolidatedItems = Array.from(
      items.reduce((map, item) => {
        const key = `${item.reference}|${item.variant || ''}`;
        const existing = map.get(key);
        if (existing) {
          existing.qty += item.qty;
        } else {
          map.set(key, { ...item });
        }
        return map;
      }, new Map<string, OrderItem>()),
    ).map(([, item]) => item);

    const resolved$ = forkJoin(
      consolidatedItems.map((item) =>
        this.resolveProduct(item.reference).pipe(
          switchMap((idProduct) =>
            this.productService.findById(idProduct).pipe(
              switchMap((product) => {
                let idAttr = 0;
                let combinationImpact = 0;
                let combination$: Observable<{ price?: string } | undefined> = of(undefined);

                if (item.variant) {
                  combination$ = this.combinationService
                    .findByOptionValue(idProduct, item.variant)
                    .pipe(
                      switchMap((foundIdAttr) => {
                        idAttr = foundIdAttr;
                        if (idAttr) {
                          return this.combinationService.getById(idAttr).pipe(
                            map((comb) => {
                              combinationImpact = parseFloat(comb.price || '0');
                              return comb;
                            }),
                          );
                        }
                        return of(undefined);
                      }),
                    );
                }

                return combination$.pipe(
                  switchMap(() =>
                    (product.id_tax_rules_group
                      ? this.resolveTaxRate(product.id_tax_rules_group)
                      : of(0)
                    ).pipe(
                      map((taxRate) => ({
                        item,
                        idProduct,
                        product,
                        idAttr,
                        combinationImpact,
                        taxRate,
                      })),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );

    return resolved$.pipe(
      switchMap((resolved) => {
        const cart_rows = resolved.map(({ idProduct, idAttr, item }) => ({
          id_product: idProduct,
          id_product_attribute: idAttr,
          id_address_delivery: idAddress,
          id_shop: DEFAULT_SHOP,
          id_shop_group: DEFAULT_SHOP_GROUP,
          id_customization: 0,
          quantity: item.qty,
        }));

        const orderRows: OrderLineItem[] = resolved.map(
          ({ idProduct, idAttr, product, item, combinationImpact, taxRate }) => {
            const productName =
              product.name?.find((n) => n.id === DEFAULT_LANG)?.value ??
              product.name?.[0]?.value ??
              item.reference;
            const basePrice = parseFloat(product.price ?? '0');
            const priceHt = (basePrice + combinationImpact).toFixed(6);
            const priceTtc = ((basePrice + combinationImpact) * (1 + taxRate / 100)).toFixed(6);
            return {
              id: 0,
              product_id: idProduct,
              product_attribute_id: idAttr,
              product_quantity: item.qty,
              product_name: productName,
              product_reference: product.reference ?? '',
              product_ean13: product.ean13 ?? '',
              product_isbn: product.isbn ?? '',
              product_upc: product.upc ?? '',
              product_price: priceHt,
              id_customization: 0,
              unit_price_tax_incl: priceTtc,
              unit_price_tax_excl: priceHt,
            };
          },
        );

        return this.cartService
          .create({
            id_currency: DEFAULT_CURRENCY,
            id_lang: DEFAULT_LANG,
            id_shop: DEFAULT_SHOP,
            id_shop_group: DEFAULT_SHOP_GROUP,
            id_customer: idCustomer,
            id_address_delivery: idAddress,
            id_address_invoice: idAddress,
            id_carrier: DEFAULT_CARRIER,
            associations: { cart_rows },
          })
          .pipe(
            switchMap((cart) => {
              const cartUpdate = {
                ...cart,
                date_add: date,
                associations: { cart_rows },
                id_customer: idCustomer,
                id_carrier: DEFAULT_CARRIER,
              };
              return this.cartService
                .update(cart.id, cartUpdate)
                .pipe(map(() => ({ idCart: cart.id, orderRows })));
            }),
          );
      }),
    );
  }

  private processOrder(
    row: OrderRow,
    idCustomer: number,
    idAddress: number,
    idCart: number,
    orderRows: OrderLineItem[],
    idState: number,
  ): Observable<number> {
    const totalProducts = orderRows
      .reduce((sum, r) => sum + r.product_quantity * parseFloat(r.unit_price_tax_excl), 0)
      .toFixed(6);
    const totalProductsWt = orderRows
      .reduce((sum, r) => sum + r.product_quantity * parseFloat(r.unit_price_tax_incl), 0)
      .toFixed(6);

    return this.orderService
      .create({
        id_address_delivery: idAddress,
        id_address_invoice: idAddress,
        id_cart: idCart,
        id_currency: DEFAULT_CURRENCY,
        id_shop: DEFAULT_SHOP,
        id_shop_group: DEFAULT_SHOP_GROUP,
        id_lang: DEFAULT_LANG,
        id_customer: idCustomer,
        id_carrier: DEFAULT_CARRIER,
        module: 'ps_checkpayment',
        payment: 'Paiement à la commande',
        total_paid: totalProductsWt,
        total_paid_real: totalProductsWt,
        total_paid_tax_incl: totalProductsWt,
        total_paid_tax_excl: totalProducts,
        total_products: totalProducts,
        total_products_wt: totalProductsWt,
        conversion_rate: '1',
        current_state: idState,
        associations: { order_rows: orderRows },
      })
      .pipe(
        map((order) => order.id),
        catchError(() => {
          return this.orderService.getAllFull({ 'filter[id_cart]': idCart }).pipe(
            switchMap((existing) => {
              if (!existing.length)
                throw new Error(`Impossible de créer la commande pour le panier #${idCart}`);
              return of(existing[0].id);
            }),
          );
        }),
      );
  }

  private updateOrderDate(
    idOrder: number,
    date: string,
    idCustomer: number,
    idAddress: number,
    idCart: number,
    orderRows: OrderLineItem[],
    idState: number,
  ): Observable<void> {
    if (!date) return of(void 0);
    const totalProducts = orderRows
      .reduce((sum, r) => sum + r.product_quantity * parseFloat(r.unit_price_tax_excl), 0)
      .toFixed(6);
    const totalProductsWt = orderRows
      .reduce((sum, r) => sum + r.product_quantity * parseFloat(r.unit_price_tax_incl), 0)
      .toFixed(6);

    return this.orderService
      .update(idOrder, {
        id_address_delivery: idAddress,
        id_address_invoice: idAddress,
        id_cart: idCart,
        id_shop: DEFAULT_SHOP,
        id_shop_group: DEFAULT_SHOP_GROUP,
        id_currency: DEFAULT_CURRENCY,
        id_lang: DEFAULT_LANG,
        id_customer: idCustomer,
        id_carrier: DEFAULT_CARRIER,
        module: 'ps_checkpayment',
        payment: 'Paiement à la commande',
        total_paid: totalProductsWt,
        total_paid_real: totalProductsWt,
        total_paid_tax_incl: totalProductsWt,
        total_paid_tax_excl: totalProducts,
        total_products: totalProducts,
        total_products_wt: totalProductsWt,
        conversion_rate: '1',
        date_add: date,
        current_state: idState,
      })
      .pipe(
        catchError(() => {
          return of(void 0);
        }),
        map(() => void 0),
      );
  }

  private applyState(idOrder: number, idState: number, date: string): Observable<void> {
    return this.orderHistoryService
      .create({
        id_order: idOrder,
        id_order_state: idState,
        date_add: date,
      })
      .pipe(
        switchMap((history) => {
          const historyUpdate = { ...history, date_add: date };
          return this.orderHistoryService.update(history.id, historyUpdate).pipe(map(() => void 0));
        }),
      );
  }

}
