import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, map, from } from 'rxjs';
import { ProductCategoryRow, parseProductCategoryCsv } from '../../utils/csv-parser';
import { CategoryService, TaxRuleGroupService } from '@app/core/services';
import { ProductWritable } from '../../models/ps/product.model';
import { ImportStats } from '../../models/import.model';
import { BaseImportService } from './base-import.service';

@Injectable({ providedIn: 'root' })
export class ProductCategoryImportService extends BaseImportService<ProductCategoryRow> {
  private readonly categoryService = inject(CategoryService);
  private readonly taxRuleGroupService = inject(TaxRuleGroupService);

  // ── Entry point ───────────────────────────────────────────────────────────

  importFile(file: File): Observable<ImportStats> {
    return from(parseProductCategoryCsv(file)).pipe(
      switchMap(({ rows, errors: parseErrors }) =>
        this.run(rows).pipe(
          map(stats => this.mergeParseErrors(stats, parseErrors))
        )
      )
    );
  }

  async validateFile(file: File): Promise<string[]> {
    try {
      const { errors } = await parseProductCategoryCsv(file);
      return errors.map(e => `Ligne ${e.row}: ${e.error}`);
    } catch (e) {
      return [e instanceof Error ? e.message : 'Erreur inconnue'];
    }
  }

  // ── Row handler ───────────────────────────────────────────────────────────

  protected override importRow(row: ProductCategoryRow): Observable<void> {
    return this.categoryService.getOrCreate(row.categorie).pipe(
      switchMap(idCategory =>
        this.taxRuleGroupService.getOrCreate(row.taxePercent).pipe(
          switchMap(idTaxGroup => this.createProduct(row, idCategory, idTaxGroup))
        )
      )
    );
  }

  // ── Product creation ──────────────────────────────────────────────────────

  private createProduct(
    row: ProductCategoryRow,
    idCategory: number,
    idTaxGroup: number,
  ): Observable<void> {
    const priceHt = row.prixTtc / (1 + row.taxePercent / 100);

    const payload: ProductWritable = {
      price: priceHt.toFixed(6),
      wholesale_price: row.prixAchat.toFixed(6),
      reference: row.reference,
      name: [{ id: 1, value: row.nom }],
      link_rewrite: [{ id: 1, value: this.slugify(row.nom) }],
      id_category_default: idCategory,
      id_tax_rules_group: idTaxGroup,
      available_for_order: true,
      product_type:'standard',
      show_price: true,
      minimal_quantity: 1,
      available_date: row.dateAvailability,
      active: true,
      state: 1,
      associations: { categories: [{ id: idCategory }] },
    };

    return this.productService.create(payload).pipe(map(() => void 0));
  }
}
