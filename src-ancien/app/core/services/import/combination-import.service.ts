import { Injectable, inject } from '@angular/core';
import { Observable, of, switchMap, map, from, forkJoin } from 'rxjs';
import { CombinationRow, parseCombinationCsv } from '../../utils/csv-parser';
import { ImportStats } from '../../models/import.model';
import { Combination } from '../../models/ps/combination.model';
import {
  ProductOptionService,
  ProductOptionValueService,
  CombinationService,
  StockAvailableService,
} from '@app/core/services';
import { BaseImportService } from './base-import.service';

@Injectable({ providedIn: 'root' })
export class CombinationImportService extends BaseImportService<CombinationRow> {
  private readonly productOptionService = inject(ProductOptionService);
  private readonly productOptionValueService = inject(ProductOptionValueService);
  private readonly combinationService = inject(CombinationService);
  private readonly stockAvailableService = inject(StockAvailableService);

  // ── Entry points ──────────────────────────────────────────────────────────

  importFile(file: File): Observable<ImportStats> {
    return from(parseCombinationCsv(file)).pipe(
      switchMap(({ rows, errors: parseErrors }) =>
        this.run(rows).pipe(map((stats) => this.mergeParseErrors(stats, parseErrors))),
      ),
    );
  }

  async validateFile(file: File): Promise<string[]> {
    try {
      const { errors } = await parseCombinationCsv(file);
      return errors.map(e => `Ligne ${e.row}: ${e.error}`);
    } catch (e) {
      return [e instanceof Error ? e.message : 'Erreur inconnue'];
    }
  }

  // ── Row handler ───────────────────────────────────────────────────────────

  protected override importRow(row: CombinationRow): Observable<void> {
    if (row.specificite && row.karazany) {
      return this.processCombination(row);
    } else {
      return this.processSimpleProduct(row);
    }
  }

  private processCombination(row: CombinationRow): Observable<void> {
    return this.productOptionService.getOrCreate(row.specificite).pipe(
      switchMap((idOption) =>
        this.productOptionValueService.getOrCreate(row.karazany, idOption).pipe(
          switchMap((idOptionValue) =>
            this.resolveProduct(row.reference).pipe(
              switchMap((idProduct) =>
                this.productService.findById(idProduct).pipe(
                  switchMap((product) => {
                    const isFirstCombination = product.product_type !== 'combinations';

                    const priceCalculation$: Observable<string | undefined> =
                      row.prixVenteTtc !== null && product.id_tax_rules_group
                        ? this.resolveTaxRate(product.id_tax_rules_group).pipe(
                            map((taxRate) =>
                              (
                                row.prixVenteTtc! / (1 + taxRate / 100) -
                                parseFloat(product.price)
                              ).toFixed(6),
                            ),
                          )
                        : of(undefined);

                    return priceCalculation$.pipe(
                      switchMap((price) =>
                        this.combinationService.create({
                          id_product: idProduct,
                          minimal_quantity: 1,
                          default_on: isFirstCombination ? true : undefined,
                          available_date: product.available_date,
                          associations: { product_option_values: [{ id: idOptionValue }] },
                          price,
                        }),
                      ),
                      switchMap((combination: Combination) => {
                        // adjustQuantity enregistre le mouvement d'entrée
                        // (ENTREE_MANUELLE) puis fixe la quantité de stock.
                        const stockUpdate$: Observable<void> = from(
                          this.stockAvailableService.adjustQuantity(
                            idProduct,
                            combination.id,
                            0,
                            row.stockInitial,
                          ),
                        );

                        let productUpdate$: Observable<void> = of(void 0);
                        if (isFirstCombination) {
                          productUpdate$ = this.productService
                            .update(idProduct, {
                              ...product,
                              product_type: 'combinations',
                              id_default_combination: combination.id,
                              cache_default_attribute: combination.id,
                            })
                            .pipe(map(() => void 0));
                        }

                        return forkJoin([stockUpdate$, productUpdate$]).pipe(
                          map(() => void 0),
                        );
                      }),
                    );
                  }),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  private processSimpleProduct(row: CombinationRow): Observable<void> {
    // adjustQuantity enregistre le mouvement d'entrée (ENTREE_MANUELLE) puis
    // fixe la quantité de stock.
    return this.resolveProduct(row.reference).pipe(
      switchMap((idProduct) =>
        from(this.stockAvailableService.adjustQuantity(idProduct, 0, 0, row.stockInitial)),
      ),
    );
  }
}
