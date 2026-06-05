import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap, map } from 'rxjs';
import { TaxRuleGroupApi } from '../api/tax-rule-group.api';
import { TaxRuleGroup, TaxRuleGroupListItem, TaxRuleGroupWritable } from '../models/ps/tax-rule-group.model';
import { TaxRuleGroupSerializer } from '../serializers/tax-rule-group.serializer';
import { PsBaseService } from './ps-base.service';
import { TaxService } from './tax.service';
import { TaxRuleService } from './tax-rule.service';
import { CacheRegistry } from './cache-registry.service';
import { DEFAULT_COUNTRY } from '@app/core';

@Injectable({ providedIn: 'root' })
export class TaxRuleGroupService extends PsBaseService<TaxRuleGroup, TaxRuleGroupWritable, TaxRuleGroupListItem> {
  protected api = inject(TaxRuleGroupApi);
  protected serializer = inject(TaxRuleGroupSerializer);

  private readonly taxService     = inject(TaxService);
  private readonly taxRuleService = inject(TaxRuleService);

  private cache: TaxRuleGroup[] | null = null;

  constructor() {
    super();
    inject(CacheRegistry).register(() => (this.cache = null));
  }

  override create(data: TaxRuleGroupWritable): Observable<TaxRuleGroup> {
    return super.create(data).pipe(
      switchMap((created) => {
        if (this.cache) this.cache.push(created);
        return of(created);
      })
    );
  }

  // Creates Tax + TaxRuleGroup + TaxRule (France, id_country: 8) if the group doesn't exist yet
  getOrCreate(taxePercent: number): Observable<number> {
    const groupName = `Taxe ${taxePercent}%`;
    const fetchCache$ = this.cache
      ? of(this.cache)
      : this.getAllFull().pipe(map(full => (this.cache = full)));

    return fetchCache$.pipe(
      switchMap(cache => {
        const existing = cache.find(g => g.name.toLowerCase() === groupName.toLowerCase());
        if (existing) return of(existing.id);

        return this.taxService.create({
          rate: String(taxePercent),
          name: [{ id: 1, value: `TVA ${taxePercent}%` }],
          active: true,
        }).pipe(
          switchMap(tax =>
            this.create({ name: groupName, active: true }).pipe(
              switchMap(group =>
                this.taxRuleService.create({ id_tax_rules_group: group.id, id_country: DEFAULT_COUNTRY, id_tax: tax.id }).pipe(
                  map(() => group.id)
                )
              )
            )
          )
        );
      })
    );
  }
}
