import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PsBaseService } from '@app/core/services/ps-base.service';
import { ProductService } from '@app/core/services/product.service';
import { CategoryService } from '@app/core/services/category.service';
import { TaxRuleGroupService } from '@app/core/services/tax-rule-group.service';
import { TaxService } from '@app/core/services/tax.service';
import { CombinationService } from '@app/core/services/combination.service';
import { ProductOptionService } from '@app/core/services/product-option.service';
import { ProductOptionValueService } from '@app/core/services/product-option-value.service';
import { CustomerService } from '@app/core/services/customer.service';
import { AddressService } from '@app/core/services/address.service';
import { CartService } from '@app/core/services/cart.service';
import { OrderService } from '@app/core/services/order.service';
import { OrderDetailService } from '@app/core/services/order-detail.service';
import { OrderHistoryService } from '@app/core/services/order-history.service';
import { OrderPaymentService } from '@app/core/services/order-payment.service';
import { OrderInvoiceService } from '@app/core/services/order-invoice.service';
import { OrderCarrierService } from '@app/core/services/order-carrier.service';
import { OrderCartRuleService } from '@app/core/services/order-cart-rule.service';
import { OrderSlipService } from '@app/core/services/order-slip.service';
import { StockMovementService } from '@app/core/services/stock-movement.service';
import { FailedItem, ProgressInfo, ResetResource, ResetResult, EndpointStat } from '../models/reset-result.model';
const CATEGORY_SYSTEM_IDS = new Set([1, 2]);
const ADDRESS_CUSTOMER_FILTER = { 'filter[id_customer]': '[1,999999]' };

@Injectable({ providedIn: 'root' })
export class ResetService {
  // ── Catalog ───────────────────────────────────────────────────────────────
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly taxRuleGroupService = inject(TaxRuleGroupService);
  private readonly taxService = inject(TaxService);
  private readonly combinationService = inject(CombinationService);
  private readonly productOptionService = inject(ProductOptionService);
  private readonly productOptionValueService = inject(ProductOptionValueService);
  // ── Orders & customers ────────────────────────────────────────────────────
  private readonly customerService = inject(CustomerService);
  private readonly addressService = inject(AddressService);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly orderDetailService = inject(OrderDetailService);
  private readonly orderHistoryService = inject(OrderHistoryService);
  private readonly orderPaymentService = inject(OrderPaymentService);
  private readonly orderInvoiceService = inject(OrderInvoiceService);
  private readonly orderCarrierService = inject(OrderCarrierService);
  private readonly orderCartRuleService = inject(OrderCartRuleService);
  private readonly orderSlipService = inject(OrderSlipService);
  private readonly stockMovementService = inject(StockMovementService);

  async reset(
    resources: ResetResource[],
    onProgress?: (info: ProgressInfo) => void,
  ): Promise<ResetResult> {
    const success: ResetResource[] = [];
    const failed: FailedItem[] = [];
    const stats: EndpointStat[] = [];
    const total = resources.length;

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const stat = await this.resetResource(resource, i, total, onProgress, failed);
      stats.push(stat);

      const resourceFailed = stat.beforeCount > 0 && stat.afterCount === stat.beforeCount;
      if (!resourceFailed) success.push(resource);
    }

    onProgress?.({
      endpoint: '',
      phase: 'done',
      itemsDone: total,
      itemsTotal: total,
      endpointsDone: total,
      endpointsTotal: total,
    });

    return { success, failed, stats };
  }

  // ── private ───────────────────────────────────────────────────────────────

  private async resetResource(
    resource: ResetResource,
    endpointsDone: number,
    endpointsTotal: number,
    onProgress: ((info: ProgressInfo) => void) | undefined,
    allFailed: FailedItem[],
  ): Promise<EndpointStat> {
    const ctx = { endpointsDone, endpointsTotal };
    const service = this.serviceFor(resource);

    onProgress?.({ endpoint: resource, phase: 'fetching', itemsDone: 0, itemsTotal: 0, ...ctx });

    const raw = await firstValueFrom(service.getAll(this.filtersFor(resource)));
    const ids = this.eligibleIds(resource, raw);
    const beforeCount = ids.length;
    let afterCount = beforeCount;

    for (let i = 0; i < ids.length; i++) {
      onProgress?.({
        endpoint: resource,
        phase: 'deleting',
        itemsDone: i,
        itemsTotal: ids.length,
        ...ctx,
      });
      try {
        await firstValueFrom(service.delete(ids[i]));
        afterCount--;
      } catch (err: Error | unknown) {
        allFailed.push({
          endpoint: resource,
          id: ids[i],
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { endpoint: resource, beforeCount, afterCount };
  }

  private serviceFor(resource: ResetResource): PsBaseService<unknown, unknown, { id: number }> {
    switch (resource) {
      case 'stock_movements':
        return this.stockMovementService;
      // catalog
      case 'combinations':
        return this.combinationService;
      case 'product_option_values':
        return this.productOptionValueService;
      case 'product_options':
        return this.productOptionService;
      case 'products':
        return this.productService;
      case 'categories':
        return this.categoryService;
      case 'tax_rule_groups':
        return this.taxRuleGroupService;
      case 'taxes':
        return this.taxService;
      // orders & customers
      case 'order_cart_rules':
        return this.orderCartRuleService;
      case 'order_payments':
        return this.orderPaymentService;
      case 'order_slip':
        return this.orderSlipService;
      case 'order_invoices':
        return this.orderInvoiceService;
      case 'order_carriers':
        return this.orderCarrierService;
      case 'order_histories':
        return this.orderHistoryService;
      case 'order_details':
        return this.orderDetailService;
      case 'orders':
        return this.orderService;
      case 'carts':
        return this.cartService;
      case 'addresses':
        return this.addressService;
      case 'customers':
        return this.customerService;
    }
  }

  private filtersFor(resource: ResetResource): Record<string, string | number> | undefined {
    if (resource === 'addresses') return ADDRESS_CUSTOMER_FILTER;
    return undefined;
  }

  private eligibleIds(resource: ResetResource, items: { id: number }[]): number[] {
    if (resource === 'categories') {
      return items.map((i) => i.id).filter((id) => !CATEGORY_SYSTEM_IDS.has(id));
    }
    return items.map((i) => i.id);
  }
}
