import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, shareReplay, take } from 'rxjs';
import { TaxService } from './tax.service';
import { TaxRuleService } from './tax-rule.service';

/**
 * Resolves a PrestaShop `id_tax_rules_group` to its numeric tax rate (%).
 *
 * Mirrors the pattern in `admin/stats/stats.component.ts`: loads taxes +
 * tax_rules once, builds the group → rate map, then serves synchronous
 * lookups.
 */
@Injectable({ providedIn: 'root' })
export class TaxResolverService {
  private readonly taxes = inject(TaxService);
  private readonly taxRules = inject(TaxRuleService);

  private rateByGroup = new Map<number, number>();
  private loaded = false;
  private load$: Observable<void> | null = null;

  /** Loads the tax tables once and caches the resolved map. */
  ensureLoaded(): Observable<void> {
    if (this.loaded) return of(void 0);
    if (!this.load$) {
      this.load$ = forkJoin({
        taxes: this.taxes.getAllFull(),
        rules: this.taxRules.getAllFull(),
      }).pipe(
        map(({ taxes, rules }) => {
          const rateByTaxId = new Map(taxes.map((t) => [t.id, parseFloat(t.rate) || 0]));
          for (const rule of rules) {
            if (!this.rateByGroup.has(rule.id_tax_rules_group)) {
              this.rateByGroup.set(
                rule.id_tax_rules_group,
                rateByTaxId.get(rule.id_tax) ?? 0,
              );
            }
          }
          this.loaded = true;
        }),
        shareReplay(1),
        take(1),
      );
    }
    return this.load$;
  }

  /** Returns the tax rate (%) for a group. 0 if unknown / not loaded. */
  getRate(idTaxRulesGroup: number | null | undefined): number {
    if (!idTaxRulesGroup) return 0;
    return this.rateByGroup.get(idTaxRulesGroup) ?? 0;
  }

  /** Converts an HT amount to TTC using the group's tax rate. */
  toTtc(ht: number, idTaxRulesGroup: number | null | undefined): number {
    return ht * (1 + this.getRate(idTaxRulesGroup) / 100);
  }
}
