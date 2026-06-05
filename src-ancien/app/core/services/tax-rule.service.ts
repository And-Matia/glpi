import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap, map } from 'rxjs';
import { TaxRuleApi } from '../api/tax-rule.api';
import { TaxRule, TaxRuleListItem, TaxRuleWritable } from '../models/ps/tax-rule.model';
import { TaxRuleSerializer } from '../serializers/tax-rule.serializer';
import { PsBaseService } from './ps-base.service';
import { CacheRegistry } from './cache-registry.service';

@Injectable({ providedIn: 'root' })
export class TaxRuleService extends PsBaseService<TaxRule, TaxRuleWritable, TaxRuleListItem> {
  protected api = inject(TaxRuleApi);
  protected serializer = inject(TaxRuleSerializer);

  private cache: TaxRule[] | null = null;

  constructor() {
    super();
    inject(CacheRegistry).register(() => (this.cache = null));
  }

  override create(data: TaxRuleWritable): Observable<TaxRule> {
    return super.create(data).pipe(
      switchMap((created) => {
        if (this.cache) this.cache.push(created);
        return of(created);
      })
    );
  }

  findByTaxRulesGroup(idTaxRulesGroup: number): Observable<TaxRule[]> {
    const fetchCache$ = this.cache
      ? of(this.cache)
      : this.getAllFull().pipe(map(full => (this.cache = full)));

    return fetchCache$.pipe(
      map(cache => cache.filter(r => r.id_tax_rules_group === idTaxRulesGroup))
    );
  }
}
