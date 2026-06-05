import { Component, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import {
  ReactiveFormsModule,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loginForm = new FormGroup({
    username : new FormControl('admin',{
      nonNullable: true,
      validators: [Validators.required],
    }),
    password : new FormControl('admin',{
      nonNullable: true,
      validators:[Validators.required]
    })
  });

  readonly error = signal('');
  readonly loading = signal(false);

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.error.set('');
    this.loading.set(true);

    const { username, password } = this.loginForm.getRawValue();

    this.auth.login(username, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((session) => {
        this.loading.set(false);
        if (session) {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.error.set('Identifiant ou mot de passe incorrect.');
        }
      });
  }
}
