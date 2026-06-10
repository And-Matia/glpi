import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketService } from '@app/core/services/glpi/ticket.service';
import { Ticket } from '@app/core/models/ticket.model';
import { GLPI_TICKET_STATUS, GLPI_TICKET_TYPE, GLPI_TICKET_PRIORITY } from '@app/core/models/ticket.model';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from '@app/shared/ui/page-header/page-header.component';
import { BadgeComponent } from '@app/shared/ui/badge/badge.component';
import { SpinnerComponent } from '@app/shared/ui/spinner/spinner.component';

@Component({
  selector: 'app-ticket-detail',
  imports: [MatCardModule, MatButtonModule, PageHeaderComponent, BadgeComponent, SpinnerComponent],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketDetailComponent implements OnInit {
  private readonly route         = inject(ActivatedRoute);
  private readonly router        = inject(Router);
  private readonly ticketService = inject(TicketService);

  readonly loading = signal(true);
  readonly error   = signal('');
  readonly ticket  = signal<Ticket | null>(null);

  readonly statusLabel   = (code: number) => GLPI_TICKET_STATUS[code]   ?? code;
  readonly typeLabel     = (code: number) => GLPI_TICKET_TYPE[code]     ?? code;
  readonly priorityLabel = (code: number) => GLPI_TICKET_PRIORITY[code] ?? code;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.ticketService.getById(id)
      .then(ticket => {
        this.ticket.set(ticket);
        this.loading.set(false);
      })
      .catch((err: Error) => {
        this.error.set(err.message ?? 'Erreur de chargement');
        this.loading.set(false);
      });
  }

  goBack(): void {
    this.router.navigate(['/back-office/tickets']);
  }
}
