import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../services/auth/AuthService/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink],
  styleUrls: ['./register.css'],
  templateUrl: './register.html'
})
export class Register {
  private auth = inject(AuthService);
  private router = inject(Router);

  userName = signal('');
  email = signal('');
  password = signal('');
  confirm = signal('');
  touched = signal(false);
  loading = signal(false);
  serverErrors = signal<string[]>([]);

  errors = computed(() => ({
    userName: this.userName().trim() ? null : 'ادخل اسم الموظف',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim()) ? null : 'ادخل ايميل صحيح',
    password: this.password().length >= 8 ? null : '8 حروف مع ارقام ورموز وحرف واحد كبير علي الاقل',
    confirm: this.password() === this.confirm() ? null : 'الباسورد غير متطابق'
  }));

  isValid = computed(() => Object.values(this.errors()).every(e => e === null));

  async submit(event: Event) {
    event.preventDefault();
    this.touched.set(true);
    if (!this.isValid()) return;

    this.loading.set(true);
    this.serverErrors.set([]);
    try {
      await this.auth.register({
        user_name: this.userName().trim(),
        email: this.email().trim(),
        password: this.password()
      });
      await this.router.navigate(['/dashboard']);
    } catch (err) {
      const e = err as HttpErrorResponse;
      this.serverErrors.set(e.error?.errors ?? (e.error?.detail == null ? ['خطأ في تسجيل حساب جديد'] : [e.error?.detail]));
    } finally {
      this.loading.set(false);
    }
  }
}