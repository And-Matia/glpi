import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UserSessionService, SessionUser } from '../services/user-session.service';
import { CustomerService } from '@app/core/services';
import { useLoader } from '@app/core/utils';

const ANONYMOUS: SessionUser = { id: 0, name: 'Utilisateur anonyme', city: '' };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,

  selector: 'app-user-select',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-select.component.html',
  styleUrl: './user-select.component.css',
})
export class UserSelectComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly userSession = inject(UserSessionService);
  private readonly customerService = inject(CustomerService);
  private readonly loader = useLoader();

  readonly users = signal<SessionUser[]>([]);
  readonly loading = this.loader.loading;
  readonly error = this.loader.error;
  readonly anonymous = ANONYMOUS;

  readonly search = signal('');
  readonly filteredUsers = computed(() => {
    const term = this.search().toLowerCase().trim();
    if (!term) return this.users();
    return this.users().filter((u) => u.name.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    void this.loader.run(async () => {
      const customers = await firstValueFrom(
        this.customerService.getAllFull({ 'filter[active]': 1 }),
      );
      this.users.set(
        customers.map((c) => ({
          id: c.id,
          name: `${c.firstname} ${c.lastname}`.trim(),
          city: '',
        })),
      );
    });
  }

  select(user: SessionUser): void {
    this.userSession.selectUser(user);
    this.router.navigate(['/catalog']);
  }
}
