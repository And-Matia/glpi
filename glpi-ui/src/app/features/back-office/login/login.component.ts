import {Component, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '@app/core/services/auth.service';
import {environment} from '../../../../environment';
import {InputComponent} from '@app/shared/ui/input/input.component';
import {ButtonComponent} from '@app/shared/ui/button/button.component';

@Component({
  selector: 'app-login',
  imports: [InputComponent, ButtonComponent],
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
