import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketV1Service } from '@app/core/services/glpi/ticket/ticket-v1.service';
import { Ticket } from '@app/core/models/ticket.model';
import { GLPI_TICKET_STATUS, GLPI_TICKET_TYPE, GLPI_TICKET_PRIORITY } from '@app/core/constants/glpi.constants';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';
import { SpinnerComponent } from '@app/shared/ui/spinner/spinner.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

@Component({
  selector: 'app-ticket-detail',
  imports: [CardComponent, PageHeaderComponent, BadgeComponent, SpinnerComponent, ButtonComponent],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketDetailComponent implements OnInit {
  private readonly route         = inject(ActivatedRoute);
  private readonly router        = inject(Router);
  private readonly ticketService = inject(TicketV1Service);

  readonly loading = signal(true);
  readonly error   = signal('');
  readonly ticket  = signal<Ticket | null>(null);

  readonly statusLabel   = (code: number) => GLPI_TICKET_STATUS[code]   ?? code;
  readonly typeLabel     = (code: number) => GLPI_TICKET_TYPE[code]     ?? code;
  readonly priorityLabel = (code: number) => GLPI_TICKET_PRIORITY[code] ?? code;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.ticketService.getById(id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Erreur de chargement');
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/back-office/tickets']);
  }
}
