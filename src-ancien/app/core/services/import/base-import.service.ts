import { inject } from '@angular/core';
import { Observable, of, switchMap, map, catchError, from, concatMap } from 'rxjs';
import { slugify } from '../../utils/string-utils';
import { ImportStats } from '../../models/import.model';
import { ProductService, TaxService, TaxRuleService, CacheRegistry } from '@app/core/services';

export type { ImportStats };

export abstract class BaseImportService<TRow> {
  protected readonly productService = inject(ProductService);
  protected readonly taxService     = inject(TaxService);
  protected readonly taxRuleService = inject(TaxRuleService);
  private   readonly cacheRegistry  = inject(CacheRegistry);

  protected abstract importRow(row: TRow, index: number): Observable<void>;

  run(rows: TRow[]): Observable<ImportStats> {
    // Drop every cached resource list so this run resolves references against
    // fresh PS data — re-importing without reloading the page must not reuse
    // ids cached during a previous import.
    this.cacheRegistry.clearAll();

    const stats: ImportStats = { total: rows.length, success: 0, failed: 0, errors: [] };

    return from(rows).pipe(
      concatMap((row, i) =>
        this.importRow(row, i).pipe(
          map(() => {
            stats.success++;
            return stats;
          }),
          catchError((err: unknown) => {
            stats.failed++;
            stats.errors.push({ row: i + 2, error: err instanceof Error ? err.message : String(err) });
            return of(stats); // Continue with the next row even if one fails
          })
        )
      ),
      map(() => stats) // Emit final statsd after all rows are processed
    );
  }

  resolveProduct(reference: string): Observable<number> {
    return this.productService.findByReference(reference);
  }

  resolveTaxRate(idTaxRulesGroup: number): Observable<number> {
    return this.taxRuleService.findByTaxRulesGroup(idTaxRulesGroup).pipe(
      switchMap(rules => {
        if (!rules.length) return of(0);
        const rule = rules[0];
        return this.taxService.findById(rule.id_tax).pipe(
          map(tax => parseFloat(tax?.rate || '0') || 0)
        );
      })
    );
  }

  toPriceImpact(ttc: number, idTaxRulesGroup: number, baseHt: number): Observable<string> {
    return this.resolveTaxRate(idTaxRulesGroup).pipe(
      map(rate => {
        const ht   = ttc / (1 + rate / 100);
        return (ht - baseHt).toFixed(6);
      })
    );
  }

  protected slugify(s: string): string { return slugify(s); }

  protected mergeParseErrors(
    stats: ImportStats,
    parseErrors: { row: number; error: string }[],
  ): ImportStats {
    if (!parseErrors.length) return stats;
    return {
      total:   stats.total + parseErrors.length,
      success: stats.success,
      failed:  stats.failed + parseErrors.length,
      errors:  [...parseErrors, ...stats.errors],
    };
  }
}
