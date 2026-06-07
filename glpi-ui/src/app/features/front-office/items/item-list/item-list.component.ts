import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ItemV2Service } from '@app/core/services/glpi/item/item-v2.service';
import { Item } from '@app/core/models';
import { ASSET_TYPE_OPTIONS, ITEM_STATUS_OPTIONS, assetLabel } from '@app/core/constants/glpi.constants';
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
  readonly items   = signal<Item[]>([]);

  readonly searchText  = signal('');
  readonly filterType  = signal<string>('');
  readonly filterStatus = signal<string>('');

  readonly typeOptions   = ASSET_TYPE_OPTIONS;
  readonly statusOptions = ITEM_STATUS_OPTIONS;

  readonly columns: TableColumn[] = [
    { key: 'name',             label: 'Nom',             sortable: true  },
    { key: 'item_type',        label: 'Type'                             },
    { key: 'status',           label: 'Statut'                           },
    { key: 'location',         label: 'Localisation'                     },
    { key: 'user',             label: 'Utilisateur'                      },
    { key: 'inventory_number', label: 'N° inventaire'                    },
  ];

  readonly filteredItems = computed(() => {
    const text   = this.searchText().toLowerCase().trim();
    const type   = this.filterType();
    const status = this.filterStatus();

    return this.items().filter(item => {
      const matchText = !text || [item.name, item.inventory_number, item.user, item.location]
        .some(v => v.toLowerCase().includes(text));
      const matchType   = !type   || item.item_type === type;
      const matchStatus = !status || item.status === status;
      return matchText && matchType && matchStatus;
    });
  });

  readonly rows = computed(() =>
    this.filteredItems().map(item => ({
      name:             item.name,
      item_type:        assetLabel(item.item_type),
      status:           item.status,
      location:         item.location,
      user:             item.user,
      inventory_number: item.inventory_number,
    }))
  );

  /** Maps a GLPI item status label to a badge colour. */
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
      next:  items => { this.items.set(items); this.loading.set(false); },
      error: ()    => { this.error.set('Impossible de charger les éléments.'); this.loading.set(false); },
    });
  }
}
