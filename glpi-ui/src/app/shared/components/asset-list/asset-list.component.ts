import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { GlpiAsset } from '@app/core/models/asset.model';
import { assetLabel } from '@app/core/constants/asset.constants';
import { TableComponent, TableColumn } from '@app/shared/ui/table/table.component';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [TableComponent],
  templateUrl: './asset-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetListComponent {
  readonly assets = input.required<GlpiAsset[]>();

  readonly columns: TableColumn[] = [
    { key: 'name',             label: 'Nom',           sortable: true },
    { key: 'type_label',       label: 'Type',          sortable: true },
    { key: 'status',           label: 'Statut',        sortable: true },
    { key: 'location',         label: 'Localisation',  sortable: true },
    { key: 'manufacturer',     label: 'Fabricant',     sortable: true },
    { key: 'model',            label: 'Modèle',        sortable: true },
    { key: 'inventory_number', label: 'N° Inventaire', sortable: true },
    { key: 'user',             label: 'Utilisateur',   sortable: true },
  ];

  readonly rows = computed(() =>
    this.assets().map(a => ({ ...a, type_label: assetLabel(a.item_type) }))
  );
}
