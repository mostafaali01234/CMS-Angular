import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../services/auth/AuthService/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  styleUrls: ['./login.css'],
  templateUrl: './login.html'
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = signal('');
  password = signal('');
  touched = signal(false);
  loading = signal(false);
  serverErrors = signal<string[]>([]);

  emailError = computed(() => {
    const v = this.email().trim();
    if (!v) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'ادخل ايميل صحيح';
    return null;
  });

  passwordError = computed(() => this.password() ? null : 'الرجاء ادخال كلمة المرور');

  isValid = computed(() => !this.emailError() && !this.passwordError());

  async submit(event: Event) {
    event.preventDefault();
    this.touched.set(true);
    if (!this.isValid()) return;

    this.loading.set(true);
    this.serverErrors.set([]);
    try {
      await this.auth.login({ email: this.email().trim(), password: this.password() });
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
      await this.router.navigateByUrl(returnUrl);
    } catch (err) {
      const e = err as HttpErrorResponse;
      this.serverErrors.set(e.error?.errors ?? ['خطأ في الايميل او كلمة المرور']);
    } finally {
      this.loading.set(false);
    }
  }
}