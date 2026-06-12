import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import {GLPI_CONFIG} from '@app/core/config/glpi.config';
import { MatButtonModule } from '@angular/material/button';
import { InputComponent } from '@app/shared/ui/input/input.component';
import {environment} from '../../../../environment';

@Component({
  selector: 'app-login',
  imports: [InputComponent, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  password = signal(environment.backOfficePassword);
  readonly error = signal('');

  onSubmit(): void {
    if (!this.password()) return;

    this.error.set('');
    const success = this.auth.login(this.password());

    if (success) {
      this.router.navigate(['/back-office/dashboard']);
    } else {
      this.error.set('Mot de passe incorrect');
    }
  }
}
