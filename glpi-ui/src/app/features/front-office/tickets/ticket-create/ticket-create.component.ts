import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { from, concatMap, Observable } from 'rxjs';
import { TicketV1Service, CreateTicketInput } from '@app/core/services/glpi/ticket/ticket-v1.service';
import { ItemV2Service } from '@app/core/services/glpi/item/item-v2.service';
import { Item } from '@app/core/models';
import { ToastService } from '@app/core/services/toast.service';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { InputComponent } from '@app/shared/ui/input/input.component';
import { TextareaComponent } from '@app/shared/ui/textarea/textarea.component';
import { SelectComponent, SelectOption } from '@app/shared/ui/select/select.component';
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

  // form fields
  readonly titre       = signal('');
  readonly description = signal('');
  readonly type        = signal<number | null>(null);
  readonly priority    = signal<number | null>(null);

  // items
  readonly allItems     = signal<Item[]>([]);
  readonly selectedIds  = signal<Set<number>>(new Set());
  readonly itemSearch   = signal('');
  readonly loadingItems = signal(true);

  // form state
  readonly submitting = signal(false);

  readonly typeOptions: SelectOption[] = [
    { value: 1, label: 'Incident' },
    { value: 2, label: 'Demande' },
  ];

  readonly priorityOptions: SelectOption[] = [
    { value: 1, label: 'Très basse' },
    { value: 2, label: 'Basse' },
    { value: 3, label: 'Moyenne' },
    { value: 4, label: 'Haute' },
    { value: 5, label: 'Très haute' },
    { value: 6, label: 'Majeure' },
  ];

  readonly visibleItems = computed(() => {
    const search = this.itemSearch().toLowerCase().trim();
    if (!search) return this.allItems();
    return this.allItems().filter(i =>
      [i.name, i.inventory_number, i.user].some(v => v.toLowerCase().includes(search))
    );
  });

  readonly selectedCount = computed(() => this.selectedIds().size);

  ngOnInit(): void {
    this.itemService.getAll().subscribe({
      next:  items => { this.allItems.set(items); this.loadingItems.set(false); },
      error: ()    => this.loadingItems.set(false),
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

    // 1. Créer le ticket, puis 2. associer chaque élément sélectionné séquentiellement
    this.ticketService.create(input).pipe(
      concatMap(({ id: ticketId }) => {
        const selectedItems = this.allItems().filter(i => this.selectedIds().has(i.id));
        if (!selectedItems.length) {
          return new Observable<void>(obs => { obs.next(); obs.complete(); });
        }
        return from(selectedItems).pipe(
          concatMap(item => this.ticketService.addItem(ticketId, item.item_type, item.id))
        );
      })
    ).subscribe({
      complete: () => {
        this.submitting.set(false);
        this.toast.success('Ticket créé avec succès !');
        this.router.navigate(['/store/items']);
      },
      error: () => {
        this.submitting.set(false);
        this.toast.error('Erreur lors de la création du ticket.');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/store/items']);
  }
}
