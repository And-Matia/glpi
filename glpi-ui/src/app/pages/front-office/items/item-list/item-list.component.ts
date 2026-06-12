import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { AssetService } from '@app/core/services/glpi/api/asset.service';
import { AssetImageService } from '@app/core/services/glpi/images/asset-image.service';
import { StateService } from '@app/core/services/glpi/lookup/state.service';
import { GlpiAsset } from '@app/core/models/asset.model';
import { assetLabel, apiTypeOf } from '@app/core/constants/asset.constants';
import { ASSET_TYPE_OPTIONS } from '@app/core/constants/asset.constants';
import { SelectComponent, SelectOption } from '@app/shared/ui/select/select.component';
import { SearchInputComponent } from '@app/shared/ui/search-input/search-input.component';
import { SpinnerComponent } from '@app/shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { BadgeComponent, BadgeVariant } from '@app/shared/ui/badge/badge.component';
import { EmptyStateComponent } from '@app/shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-item-list',
  imports: [
    SelectComponent,
    SearchInputComponent,
    SpinnerComponent,
    PageHeaderComponent,
    BadgeComponent,
    EmptyStateComponent,
  ],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemListComponent implements OnInit {
  private readonly itemService  = inject(AssetService);
  private readonly imageService = inject(AssetImageService);
  private readonly stateService = inject(StateService);

  readonly loading   = signal(true);
  readonly error     = signal('');
  readonly assets    = signal<GlpiAsset[]>([]);
  readonly imageUrls = signal<Record<string, string>>({});

  searchText   = signal('');
  filterType   = signal('');
  filterStatus = signal('');

  readonly typeOptions   = ASSET_TYPE_OPTIONS;
  readonly statusOptions = signal<SelectOption[]>([]);

  readonly filteredAssets = computed(() => {
    const text   = this.searchText().toLowerCase().trim();
    const type   = this.filterType();
    const status = this.filterStatus();

    return this.assets().filter(a => {
      const matchText   = !text   || [a.name, a.inventory_number, a.user, a.location].some(v => v?.toLowerCase().includes(text));
      const matchType   = !type   || a.item_type === type;
      const matchStatus = !status || a.status === status;
      return matchText && matchType && matchStatus;
    });
  });

  assetLabel = assetLabel;

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

  imageKey(asset: GlpiAsset): string {
    return `${asset.item_type}-${asset.id}`;
  }

  getImage(asset: GlpiAsset): string | null {
    return this.imageUrls()[this.imageKey(asset)] ?? null;
  }

  typeIcon(itemType: string): string {
    const icons: Record<string, string> = {
      Computer:          'fa-solid fa-desktop',
      Monitor:           'fa-solid fa-display',
      Phone:             'fa-solid fa-mobile-screen',
      // Printer:           'fa-solid fa-print',
      // Peripheral:        'fa-solid fa-keyboard',
      // NetworkEquipment:  'fa-solid fa-network-wired',
      // Enclosure:         'fa-solid fa-server',
      // PDU:               'fa-solid fa-plug',
      // Rack:              'fa-solid fa-server',
      // Software:          'fa-solid fa-floppy-disk',
      // SoftwareLicense:   'fa-solid fa-key',
    };
    return icons[itemType] ?? 'fa-solid fa-box';
  }

  ngOnInit(): void {
    Promise.all([
      this.itemService.getAll(),
      this.stateService.getAll(),
    ]).then(([assets, states]) => {
      this.assets.set(assets);
      this.statusOptions.set(states.map(s => ({ value: s.name, label: s.name })));
      this.loading.set(false);
      this.loadImages(assets);
    }).catch(() => {
      this.error.set('Impossible de charger les éléments.');
      this.loading.set(false);
    });
  }

  private loadImages(assets: GlpiAsset[]): void {
    for (const asset of assets) {
      const apiType = apiTypeOf(asset.item_type);
      this.imageService.getImageUrl(asset.id, apiType).then(url => {
        console.log(`[ItemList] image result for ${this.imageKey(asset)}:`, url ?? 'null (no image)');
        if (url) {
          this.imageUrls.update(prev => ({ ...prev, [this.imageKey(asset)]: url }));
        }
      });
    }
  }
}
