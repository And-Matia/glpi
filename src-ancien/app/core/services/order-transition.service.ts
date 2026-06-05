import { inject, Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { OrderTransitionApi } from '@app/core/api/order-transition.api';
import { OrderTransitionModuleApi } from '@app/core/api/order-transition-module.api';
import { OrderTransition, OrderTransitionListItem, OrderTransitionWritable } from '@app/core/models/ps/order-transition.model';
import { OrderTransitionSerializer } from '@app/core/serializers/order-transition.serializer';
import { OrderTransitionModuleSerializer } from '@app/core/serializers/order-transition-module.serializer';
import { PsBaseService } from './ps-base.service';

@Injectable({ providedIn: 'root' })
export class OrderTransitionService extends PsBaseService<OrderTransition, OrderTransitionWritable, OrderTransitionListItem> {
  protected api = inject(OrderTransitionApi);
  protected serializer = inject(OrderTransitionSerializer);

  // module API + serializer for state transitions (POST/PUT)
  private moduleApi = inject(OrderTransitionModuleApi);
  private moduleSerializer = inject(OrderTransitionModuleSerializer);

  // allowed target states: 5 (Delivered) or 6 (Cancelled)
  private static readonly ALLOWED_STATES = [5, 6];

  getByOrder(idOrder: number): Observable<OrderTransitionListItem[]> {
    return this.getAll({ 'filter[id_order]': idOrder });
  }

  /**
   * Create a state transition via the module endpoint
   * Only allows transitions to state 5 (Delivered) or 6 (Cancelled)
   */
  override create(data: OrderTransitionWritable): Observable<OrderTransition> {
    this.validateOrderState(data.id_order_state);
    data = this.withOptionalDate(data);
    return this.moduleApi.create(this.moduleSerializer.serializeForWrite(data)).pipe(
      map((xml: string) => this.moduleSerializer.parseOne(xml)),
      catchError(err => this.handleModuleError(err)),
    );
  }

  /**
   * Update a state transition via the module endpoint
   * Only allows transitions to state 5 (Delivered) or 6 (Cancelled)
   */
  override update(id: string | number, data: OrderTransitionWritable): Observable<OrderTransition> {
    this.validateOrderState(data.id_order_state);
    data = this.withOptionalDate(data);
    return this.moduleApi.update(id, this.moduleSerializer.serializeForUpdate(Number(id), data)).pipe(
      map((xml: string) => this.moduleSerializer.parseOne(xml)),
      catchError(err => this.handleModuleError(err)),
    );
  }

  /**
   * Keep date_add only when a real value is provided.
   * An empty/missing date is dropped so it is never sent in the request.
   */
  private withOptionalDate(data: OrderTransitionWritable): OrderTransitionWritable {
    if (data.date_add) return data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { date_add, ...rest } = data;
    return rest;
  }

  private validateOrderState(stateId: number): void {
    if (!OrderTransitionService.ALLOWED_STATES.includes(stateId)) {
      throw new Error(
        `Invalid order state: ${stateId}. Only states 5 (Delivered) or 6 (Cancelled) are allowed.`,
      );
    }
  }

  private handleModuleError(err: unknown): Observable<never> {
    if (err instanceof HttpErrorResponse) {
      // Try to extract PrestaShop XML error message
      let message = `[${err.status}] ${err.statusText || 'HTTP Error'}`;
      try {
        if (err.error && typeof err.error === 'string') {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(err.error, 'text/xml');
          const errorMsg = xmlDoc.querySelector('error message');
          if (errorMsg?.textContent) {
            message = errorMsg.textContent.trim();
          }
        }
      } catch {
        // fallback to status message if XML parsing fails
      }
      return throwError(() => new Error(message));
    }
    const message = err instanceof Error ? err.message : String(err);
    return throwError(() => (err instanceof Error ? err : new Error(message)));
  }
}
