import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap, map, forkJoin } from 'rxjs';
import { CombinationApi } from '../api/combination.api';
import { Combination, CombinationListItem, CombinationWritable } from '../models/ps/combination.model';
import { CombinationSerializer } from '../serializers/combination.serializer';
import { psLang } from '../utils';
import { PsBaseService } from './ps-base.service';
import { ProductOptionValueService } from './product-option-value.service';
import { ProductOptionService } from './product-option.service';
import { CacheRegistry } from './cache-registry.service';

@Injectable({ providedIn: 'root' })
export class CombinationService extends PsBaseService<Combination, CombinationWritable, CombinationListItem> {
  protected api        = inject(CombinationApi);
  protected serializer = inject(CombinationSerializer);

  private readonly productOptionValueService = inject(ProductOptionValueService);
  private readonly productOptionService = inject(ProductOptionService);

  private cache: Combination[] | null = null;

  constructor() {
    super();
    inject(CacheRegistry).register(() => (this.cache = null));
  }

  override create(data: CombinationWritable): Observable<Combination> {
    return super.create(data).pipe(
      switchMap((created) => {
        if (this.cache) this.cache.push(created);
        return of(created);
      })
    );
  }

  /**
   * Construit un libellé lisible par déclinaison (id_product_attribute) :
   * "Couleur: Rouge, Taille: M" — en résolvant
   * combination → product_option_values → product_options.
   */
  getVariantLabelMap(): Observable<Map<number, string>> {
    return forkJoin({
      combos:  this.getAllFull(),
      values:  this.productOptionValueService.getAllFull(),
      options: this.productOptionService.getAllFull(),
    }).pipe(
      map(({ combos, values, options }) => {
        const optionName = new Map<number, string>(
          options.map((o) => [o.id, psLang(o.public_name) || psLang(o.name)]),
        );
        const valueInfo = new Map<number, { name: string; group: number }>(
          values.map((v) => [v.id, { name: psLang(v.name), group: v.id_attribute_group }]),
        );

        const labels = new Map<number, string>();
        for (const c of combos) {
          const parts = (c.associations?.product_option_values ?? [])
            .map((ov) => {
              const vi = valueInfo.get(ov.id);
              if (!vi) return '';
              const group = optionName.get(vi.group);
              return group ? `${group}: ${vi.name}` : vi.name;
            })
            .filter(Boolean);
          labels.set(c.id, parts.join(', '));
        }
        return labels;
      }),
    );
  }

  findByOptionValue(idProduct: number, variantName: string): Observable<number> {
    const fetchCache$ = this.cache
      ? of(this.cache)
      : this.getAllFull().pipe(map(full => (this.cache = full)));

    return fetchCache$.pipe(
      switchMap(cache =>
        this.productOptionValueService.findByName(variantName).pipe(
          map(valueList => {
            if (!valueList.length) return 0;
            const targetIds = new Set(valueList.map(v => v.id));
            const combo = cache.find(c =>
              c.id_product === idProduct &&
              (c.associations?.product_option_values ?? []).some(v => targetIds.has(v.id))
            );
            return combo ? combo.id : 0;
          })
        )
      )
    );
  }
}
