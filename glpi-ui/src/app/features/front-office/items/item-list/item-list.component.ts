import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ItemV2Service } from '@app/core/services/glpi/item/item-v2.service';
import { GlpiAsset } from '@app/core/models/glpi/assets/glpi-asset.model';
import { ASSET_TYPE_OPTIONS, assetLabel } from '@app/core/constants/glpi.constants';
import { ITEM_STATUS_OPTIONS } from '@app/core/constants/item.constants';
import { SelectComponent } from '@app/shared/ui/select/select.component';
import { SearchInputComponent } from '@app/shared/ui/search-input/search-input.component';
import { SpinnerComponent } from '@app/shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { TableComponent, TableColumn } from '@app/shared/ui/table/table.component';
import { TableCellDirective } from '@app/shared/ui/table/table-cell.directive';
import { BadgeComponent, BadgeVariant } from '@app/shared/ui/badge/badge.component';
import { AvatarComponent } from '@app/shared/ui/avatar/avatar.component';

@Component({
  selector: 'app-item-list',
  imports: [
    SelectComponent,
    SearchInputComponent,
    SpinnerComponent,
    PageHeaderComponent,
    TableComponent,
    TableCellDirective,
    BadgeComponent,
    AvatarComponent,
  ],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemListComponent implements OnInit {
  private readonly itemService = inject(ItemV2Service);

  readonly loading = signal(true);
  readonly error   = signal('');
  readonly assets  = signal<GlpiAsset[]>([]);

  readonly searchText   = signal('');
  readonly filterType   = signal('');
  readonly filterStatus = signal('');

  readonly typeOptions   = ASSET_TYPE_OPTIONS;
  readonly statusOptions = ITEM_STATUS_OPTIONS;

  readonly columns: TableColumn[] = [
    { key: 'name',             label: 'Nom',           sortable: true },
    { key: 'item_type',        label: 'Type'                         },
    { key: 'status',           label: 'Statut'                       },
    { key: 'location',         label: 'Localisation'                 },
    { key: 'user',             label: 'Utilisateur'                  },
    { key: 'inventory_number', label: 'N° inventaire'                },
  ];

  readonly filteredAssets = computed(() => {
    const text   = this.searchText().toLowerCase().trim();
    const type   = this.filterType();
    const status = this.filterStatus();

    return this.assets().filter(a => {
      const matchText   = !text   || [a.name, a.inventory_number, a.user, a.location].some(v => v.toLowerCase().includes(text));
      const matchType   = !type   || a.item_type === type;
      const matchStatus = !status || a.status === status;
      return matchText && matchType && matchStatus;
    });
  });

  readonly rows = computed(() =>
    this.filteredAssets().map(a => ({
      name:             a.name,
      item_type:        assetLabel(a.item_type),
      status:           a.status,
      location:         a.location,
      user:             a.user,
      inventory_number: a.inventory_number,
    }))
  );

  statusVariant(status: string): BadgeVariant {
    switch (status) {
      case 'En production': return 'success';
      case 'En stock':      return 'info';
      case 'Maintenance':   return 'warning';
      case 'En panne':      return 'danger';
      case 'Hors service':  return 'neutral';
      default:              return 'neutral';
    }
  }

  ngOnInit(): void {
    this.itemService.getAll().subscribe({
      next:  assets => { this.assets.set(assets); this.loading.set(false); },
      error: ()     => { this.error.set('Impossible de charger les éléments.'); this.loading.set(false); },
    });
  }
}
