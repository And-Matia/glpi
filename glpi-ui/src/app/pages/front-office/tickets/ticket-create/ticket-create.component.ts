import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { TicketService, CreateTicketInput } from '@app/core/services/glpi/api/ticket.service';
import { AssetService } from '@app/core/services/glpi/api/asset.service';
import { GlpiAsset } from '@app/core/models/asset.model';
import { TICKET_TYPE_OPTIONS, TICKET_PRIORITY_OPTIONS, TICKET_STATUSES } from '@app/core/constants/assistance.constants';
import { assetLabel } from '@app/core/constants/asset.constants';
import { ToastService } from '@app/core/services/ui/toast.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { InputComponent } from '@app/shared/ui/input/input.component';
import { TextareaComponent } from '@app/shared/ui/textarea/textarea.component';
import { SelectComponent } from '@app/shared/ui/select/select.component';
import { SearchInputComponent } from '@app/shared/ui/search-input/search-input.component';
import { SpinnerComponent } from '@app/shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';

@Component({
  selector: 'app-ticket-create',
  imports: [
    MatButtonModule,
    MatCardModule,
    InputComponent,
    TextareaComponent,
    SelectComponent,
    SearchInputComponent,
    SpinnerComponent,
    PageHeaderComponent,
    BadgeComponent,
  ],
  templateUrl: './ticket-create.component.html',
  styleUrl: './ticket-create.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketCreateComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly itemService   = inject(AssetService);
  private readonly router        = inject(Router);
  private readonly toast         = inject(ToastService);

  titre       = signal('');
  description = signal('');
  type        = signal<number | null>(null);
  priority    = signal<number | null>(null);
  status      = signal<number | null>(null);

  readonly allAssets    = signal<GlpiAsset[]>([]);
  readonly selectedIds  = signal<Set<number>>(new Set());
  itemSearch   = signal('');
  readonly loadingItems = signal(true);
  readonly submitting   = signal(false);

  readonly typeOptions     = TICKET_TYPE_OPTIONS;
  readonly priorityOptions = TICKET_PRIORITY_OPTIONS;
  readonly statusOptions   = TICKET_STATUSES.map(s => ({ value: s.code, label: s.label }));
  readonly assetLabel      = assetLabel;

  readonly visibleAssets = computed(() => {
    const search = this.itemSearch().toLowerCase().trim();
    if (!search) return this.allAssets();
    return this.allAssets().filter(a =>
      [a.name, a.inventory_number, a.user].some(v => v.toLowerCase().includes(search))
    );
  });

  readonly selectedCount = computed(() => this.selectedIds().size);

  ngOnInit(): void {
    this.itemService.getAll()
      .then(assets => { this.allAssets.set(assets); this.loadingItems.set(false); })
      .catch(() => this.loadingItems.set(false));
  }

  toggleItem(id: number): void {
    this.selectedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  async onSubmit(): Promise<void> {
    const titre       = this.titre().trim();
    const description = this.description().trim();
    const type        = this.type();
    const priority    = this.priority();

    if (!titre || !description || !type || !priority) {
      this.toast.warning('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const statusValue = this.status() ? Number(this.status()) : undefined;
    const isClosed    = statusValue === 6;
    const input: CreateTicketInput = {
      titre, description,
      type:     Number(type),
      priority: Number(priority),
      status:   isClosed ? 1 : statusValue,
    };
    this.submitting.set(true);

    try {
      const { id: ticketId } = await this.ticketService.create(input);
      const selected = this.allAssets().filter(a => this.selectedIds().has(a.id));
      for (const asset of selected) {
        await this.ticketService.addItem(ticketId, asset.item_type, asset.id);
      }
      if (isClosed) {
        await this.ticketService.update(ticketId, { status: 6 });
      }
      this.submitting.set(false);
      this.toast.success('Ticket créé avec succès !');
      this.router.navigate(['/front-office/items']);
    } catch {
      this.submitting.set(false);
      this.toast.error('Erreur lors de la création du ticket.');
    }
  }

  goBack(): void {
    this.router.navigate(['/front-office/items']);
  }
}
