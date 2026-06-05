import { Injectable } from '@angular/core';
import { PsBaseApi } from './ps-base.api';

/**
 * API for the psorderapi module endpoint — used only for state transitions
 * POST/PUT to /ps-module/module/psorderapi/orderstate
 */
@Injectable({ providedIn: 'root' })
export class OrderTransitionModuleApi extends PsBaseApi {
  protected resource = 'module/psorderapi/orderstate';
  protected override apiOrigin = '/ps-module';
}



