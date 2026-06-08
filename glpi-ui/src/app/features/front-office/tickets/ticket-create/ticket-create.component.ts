import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { from, concatMap, Observable } from 'rxjs';
import { TicketV1Service, CreateTicketInput } from '@app/core/services/glpi/ticket/ticket-v1.service';
import { ItemV2Service } from '@app/core/services/glpi/item/item-v2.service';
import { GlpiAsset } from '@app/core/models/glpi/assets/glpi-asset.model';
import { TICKET_TYPE_OPTIONS, TICKET_PRIORITY_OPTIONS } from '@app/core/constants/ticket.constants';
import { assetLabel } from '@app/core/constants/glpi.constants';
import { ToastService } from '@app/core/services/toast.service';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { InputComponent } from '@app/shared/ui/input/input.component';
import { TextareaComponent } from '@app/shared/ui/textarea/textarea.component';
import { SelectComponent } from '@app/shared/ui/select/select.component';
import { SearchInputComponent } from '@app/shared/ui/search-input/search-input.component';
import { SpinnerComponent } from '@app/shared/ui/spinner/spinner.component';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';

@Component({
  selector: 'app-ticket-create',
  imports: [
    ButtonComponent,
    InputComponent,
    TextareaComponent,
    SelectComponent,
    SearchInputComponent,
    SpinnerComponent,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
  ],
  templateUrl: './ticket-create.component.html',
  styleUrl: './ticket-create.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketCreateComponent implements OnInit {
  private readonly ticketService = inject(TicketV1Service);
  private readonly itemService   = inject(ItemV2Service);
  private readonly router        = inject(Router);
  private readonly toast         = inject(ToastService);

  readonly titre       = signal('');
  readonly description = signal('');
  readonly type        = signal<number | null>(null);
  readonly priority    = signal<number | null>(null);

  readonly allAssets    = signal<GlpiAsset[]>([]);
  readonly selectedIds  = signal<Set<number>>(new Set());
  readonly itemSearch   = signal('');
  readonly loadingItems = signal(true);
  readonly submitting   = signal(false);

  readonly typeOptions     = TICKET_TYPE_OPTIONS;
  readonly priorityOptions = TICKET_PRIORITY_OPTIONS;
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
    this.itemService.getAll().subscribe({
      next:  assets => { this.allAssets.set(assets); this.loadingItems.set(false); },
      error: ()     => this.loadingItems.set(false),
    });
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

  onSubmit(): void {
    const titre       = this.titre().trim();
    const description = this.description().trim();
    const type        = this.type();
    const priority    = this.priority();

    if (!titre || !description || !type || !priority) {
      this.toast.warning('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const input: CreateTicketInput = { titre, description, type: Number(type), priority: Number(priority) };
    this.submitting.set(true);

    this.ticketService.create(input).pipe(
      concatMap(({ id: ticketId }) => {
        const selected = this.allAssets().filter(a => this.selectedIds().has(a.id));
        if (!selected.length) return new Observable<void>(obs => { obs.next(); obs.complete(); });
        return from(selected).pipe(
          concatMap(a => this.ticketService.addItem(ticketId, a.item_type, a.id))
        );
      })
    ).subscribe({
      complete: () => {
        this.submitting.set(false);
        this.toast.success('Ticket créé avec succès !');
        this.router.navigate(['/front-office/items']);
      },
      error: () => {
        this.submitting.set(false);
        this.toast.error('Erreur lors de la création du ticket.');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/front-office/items']);
  }
}
