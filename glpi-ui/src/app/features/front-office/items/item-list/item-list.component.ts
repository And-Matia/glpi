import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ItemV2Service } from '@app/core/services/glpi/item/item-v2.service';
import { ItemImageService } from '@app/core/services/glpi/item/item-image.service';
import { GlpiAsset, assetLabel, apiTypeOf } from '@app/core/models/glpi/assets/glpi-asset.model';
import { ASSET_TYPE_OPTIONS } from '@app/core/constants/glpi.constants';
import { ITEM_STATUS_OPTIONS } from '@app/core/constants/item.constants';
import { SelectComponent } from '@app/shared/ui/select/select.component';
import { SearchInputComponent } from '@app/shared/ui/search-input/search-input.component';
import { SpinnerComponent } from '@app/shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { BadgeComponent, BadgeVariant } from '@app/shared/ui/badge/badge.component';
import { EmptyStateComponent } from '@app/shared/ui/empty-state/empty-state.component';
import {ItemV1Service} from '@app/core/services/glpi/item/item-v1.service';

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
  private readonly itemService  = inject(ItemV2Service);
  private readonly imageService = inject(ItemImageService);

  readonly loading = signal(true);
  readonly error   = signal('');
  readonly assets  = signal<GlpiAsset[]>([]);
  readonly imageUrls = signal<Record<string, string>>({});

  readonly searchText   = signal('');
  readonly filterType   = signal('');
  readonly filterStatus = signal('');

  readonly typeOptions   = ASSET_TYPE_OPTIONS;
  readonly statusOptions = ITEM_STATUS_OPTIONS;

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
      Printer:           'fa-solid fa-print',
      Phone:             'fa-solid fa-mobile-screen',
      Peripheral:        'fa-solid fa-keyboard',
      NetworkEquipment:  'fa-solid fa-network-wired',
      Enclosure:         'fa-solid fa-server',
      PDU:               'fa-solid fa-plug',
      Rack:              'fa-solid fa-server',
      Software:          'fa-solid fa-floppy-disk',
      SoftwareLicense:   'fa-solid fa-key',
    };
    return icons[itemType] ?? 'fa-solid fa-box';
  }

  ngOnInit(): void {
    this.itemService.getAll().subscribe({
      next: assets => {
        this.assets.set(assets);
        this.loading.set(false);
        this.loadImages(assets);
      },
      error: () => {
        this.error.set('Impossible de charger les éléments.');
        this.loading.set(false);
      },
    });
  }

  private loadImages(assets: GlpiAsset[]): void {
    for (const asset of assets) {
      const apiType = apiTypeOf(asset.item_type);
      this.imageService.getImageUrl(asset.id, apiType).subscribe(url => {
        if (url) {
          this.imageUrls.update(prev => ({ ...prev, [this.imageKey(asset)]: url }));
        }
      });
    }
  }
}
