import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { StockAvailableApi } from '../api/stock-available.api';
import { StockAvailable, StockAvailableListItem, StockAvailableWritable } from '../models/ps/stock-available.model';
import { StockMovementWritable } from '../models/ps/stock-movement.model';
import { StockAvailableSerializer } from '../serializers/stock-available.serializer';
import { PsBaseService } from './ps-base.service';
import { StockMovementService } from './stock-movement.service';
import { ProductService } from './product.service';
import { CombinationService } from './combination.service';
import { StockMvtReason, DEFAULT_EMPLOYEE, DEFAULT_SHOP } from '../constants/import.constants';

@Injectable({ providedIn: 'root' })
export class StockAvailableService extends PsBaseService<
  StockAvailable,
  StockAvailableWritable,
  StockAvailableListItem
> {
  protected api = inject(StockAvailableApi);
  protected serializer = inject(StockAvailableSerializer);
  private stockMovement = inject(StockMovementService);
  private productService = inject(ProductService);
  private combinationService = inject(CombinationService);

  async adjustQuantity(
    idProduct: number,
    idProductAttribute: number,
    oldQuantity: number,
    newQuantity: number,
  ): Promise<void> {
    // id du StockAvailable concerné : sert de id_stock pour le mouvement,
    // afin que celui-ci puisse être relié au produit lors de la lecture.
    const idStockAvailable = await this.findStockAvailableId(idProduct, idProductAttribute);

    const delta = newQuantity - oldQuantity;
    if (delta !== 0) {
      // PrestaShop n'enregistre pas id_product/id_stock de façon fiable sur
      // stock_mvt : on écrit aussi le nom et la référence du produit dans les
      // champs texte du mouvement, qui eux sont bien persistés.
      const { name, reference } = await this.resolveProductIdentity(
        idProduct,
        idProductAttribute,
      );

      const payload: StockMovementWritable = {
        id_stock: idStockAvailable,
        id_stock_mvt_reason:
          delta > 0 ? StockMvtReason.ENTREE_MANUELLE : StockMvtReason.SORTIE_MANUELLE,
        id_employee: DEFAULT_EMPLOYEE,
        id_product: idProduct,
        id_product_attribute: idProductAttribute,
        id_warehouse: null,
        id_currency: null,
        id_order: null,
        id_supply_order: null,
        management_type: '',
        product_name: name ? [{ id: 1, value: name }] : [],
        ean13: '',
        upc: '',
        reference,
        mpn: '',
        physical_quantity: Math.abs(delta),
        sign: delta > 0 ? 1 : -1,
        last_wa: '0',
        current_wa: '0',
        price_te: '0',
        date_add: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      await firstValueFrom(this.stockMovement.create(payload));
    }
    await this.setQuantity(idProduct, idProductAttribute, newQuantity, idStockAvailable);
  }

  /** Nom et référence du produit (référence de la déclinaison si applicable). */
  private async resolveProductIdentity(
    idProduct: number,
    idProductAttribute: number,
  ): Promise<{ name: string; reference: string }> {
    let name = '';
    let reference = '';
    try {
      const product = await firstValueFrom(this.productService.getById(idProduct));
      name = product.name?.find((l) => l.id === 1)?.value ?? product.name?.[0]?.value ?? '';
      reference = product.reference ?? '';
    } catch {
      /* produit introuvable : champs laissés vides */
    }
    if (idProductAttribute > 0) {
      try {
        const combination = await firstValueFrom(
          this.combinationService.getById(idProductAttribute),
        );
        if (combination.reference) reference = combination.reference;
      } catch {
        /* combinaison introuvable */
      }
    }
    return { name, reference };
  }

  /** Retourne l'id du StockAvailable pour un couple produit / déclinaison. */
  private async findStockAvailableId(
    idProduct: number,
    idProductAttribute: number,
  ): Promise<number> {
    // On filtre uniquement par produit puis on sélectionne la bonne
    // déclinaison côté client : le filtre combiné du webservice PS est
    // peu fiable (il peut renvoyer une liste non filtrée → mauvais id).
    const list = await firstValueFrom(
      this.getAllFull({ 'filter[id_product]': idProduct }),
    );
    const match = list.find(
      s => s.id_product === idProduct && s.id_product_attribute === idProductAttribute,
    );
    if (match) return match.id;
    throw new Error(
      `StockAvailable introuvable — produit ${idProduct}, attribut ${idProductAttribute}`,
    );
  }

  async setQuantity(
    idProduct: number,
    idProductAttribute: number,
    quantity: number,
    idStockAvailable?: number,
  ): Promise<void> {
    const id = idStockAvailable
      ?? (await this.findStockAvailableId(idProduct, idProductAttribute));
    await firstValueFrom(
      this.update(id, {
        id_product: idProduct,
        id_product_attribute: idProductAttribute,
        id_shop: DEFAULT_SHOP,
        quantity: quantity,
        depends_on_stock: false,
        out_of_stock: 2,
      }),
    );
  }

  /**
   * Build a set of product IDs that have at least one variant stock line
   * (id_product_attribute !== 0). Used by UI code to mark parent rows.
   */
  computeHasVariantSet(stocks: StockAvailable[]): Set<number> {
    const set = new Set<number>();
    for (const s of stocks) {
      if (s.id_product_attribute && s.id_product_attribute !== 0) {
        set.add(s.id_product);
      }
    }
    return set;
  }
}
