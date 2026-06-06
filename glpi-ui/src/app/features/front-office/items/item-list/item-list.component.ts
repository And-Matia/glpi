import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ItemV2Service } from '@app/core/services/glpi/item/item-v2.service';
import { Item, ItemType } from '@app/core/models';
import { SelectComponent, SelectOption } from '@app/shared/ui/select/select.component';
import { SpinnerComponent } from '@app/shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { TableComponent, TableColumn } from '@app/shared/ui/table/table.component';

@Component({
  selector: 'app-item-list',
  imports: [
    FormsModule,
    SelectComponent,
    SpinnerComponent,
    PageHeaderComponent,
    TableComponent,
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

  readonly typeOptions: SelectOption[] = [
    { value: '', label: 'Tous les types' },
    { value: 'Computer', label: 'Ordinateur' },
    { value: 'Monitor',  label: 'Moniteur' },
  ];

  readonly statusOptions: SelectOption[] = [
    { value: '',           label: 'Tous les statuts' },
    { value: 'En stock',   label: 'En stock' },
    { value: 'En production', label: 'En production' },
    { value: 'En panne',   label: 'En panne' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Hors service', label: 'Hors service' },
  ];

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
      item_type:        item.item_type === 'Computer' ? 'Ordinateur' : 'Moniteur',
      status:           item.status,
      location:         item.location,
      user:             item.user,
      inventory_number: item.inventory_number,
    }))
  );

  ngOnInit(): void {
    this.itemService.getAll().subscribe({
      next:  items => { this.items.set(items); this.loading.set(false); },
      error: ()    => { this.error.set('Impossible de charger les éléments.'); this.loading.set(false); },
    });
  }
}
