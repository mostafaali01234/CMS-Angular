import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AccountService, UserList } from '../../core/services/AccountService/account';
import { AuthService } from '../../core/services/AuthService/auth';
import { ConfirmService } from '../../shared/services/confirm.service';


/** Handles both { errors: [...] } and ASP.NET validation { errors: { Field: [...] } }. */
function extractErrors(err: unknown, fallback: string): string[] {
  const e = (err as HttpErrorResponse)?.error?.errors;
  if (Array.isArray(e)) return e;
  if (e && typeof e === 'object') return Object.values(e).flat() as string[];
  return [fallback];
}

@Component({
  imports: [],
  standalone: true,
  selector: 'app-user-account-settings',
  styleUrl: './user-account-settings.css',
  templateUrl: './user-account-settings.html',
})
export class UserAccountSettings implements OnInit {
  auth = inject(AuthService);
  private account = inject(AccountService);

  loading = signal(true);
  loadError = signal<string | null>(null);

private confirm = inject(ConfirmService);
deletingId = signal<number | null>(null);

  // ---- profile ----
  userList = signal<UserList[]>([]);
  email = signal('');
  fullName = signal('');
  phone = signal('');
  profileTouched = signal(false);
  profileSaving = signal(false);
  profileErrors = signal<string[]>([]);
  profileSaved = signal(false);

  fullNameError = computed(() =>
    this.fullName().trim() ? null : 'Full name is required.');

  // ---- password ----
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  passwordTouched = signal(false);
  passwordSaving = signal(false);
  passwordErrors = signal<string[]>([]);
  passwordSaved = signal(false);
  resetMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  resettingUserId = signal<string | null>(null);
  private resetTimer?: ReturnType<typeof setTimeout>;


  passwordFieldErrors = computed(() => ({
    current: this.currentPassword() ? null : 'Enter your current password.',
    next: this.newPassword().length >= 8 ? null : 'New password must be at least 8 characters.',
    confirm: this.newPassword() === this.confirmPassword() ? null : 'Passwords do not match.'
  }));

  async ngOnInit() {
    try {
      const p = await this.account.getProfile();
      this.email.set(p.email);
      this.fullName.set(p.fullName);
      this.phone.set(p.phoneNumber ?? '');
    } catch {
      this.loadError.set('Failed to load your account.');
    } finally {
      this.loading.set(false);
    }
    
    try {
      const p = await this.account.getUserListAdmin();
      this.userList.set(p);
    } catch {
      this.loadError.set('Failed to load accounts list.');
    } finally {
      this.loading.set(false);
    }
  }

  async saveProfile(event: Event) {
    event.preventDefault();
    this.profileTouched.set(true);
    this.profileSaved.set(false);
    if (this.fullNameError()) return;

    this.profileSaving.set(true);
    this.profileErrors.set([]);
    try {
      const p = await this.account.updateProfile({
        fullName: this.fullName().trim(),
        phoneNumber: this.phone().trim() || null
      });
      this.fullName.set(p.fullName);
      this.phone.set(p.phoneNumber ?? '');
      this.profileSaved.set(true);
    } catch (err) {
      this.profileErrors.set(extractErrors(err, 'Could not save your profile.'));
    } finally {
      this.profileSaving.set(false);
    }
  }

  async changePassword(event: Event) {
    event.preventDefault();
    this.passwordTouched.set(true);
    this.passwordSaved.set(false);
    if (Object.values(this.passwordFieldErrors()).some(e => e)) return;

    this.passwordSaving.set(true);
    this.passwordErrors.set([]);
    try {
      await this.account.changePassword({
        currentPassword: this.currentPassword(),
        newPassword: this.newPassword()
      });
      this.currentPassword.set('');
      this.newPassword.set('');
      this.confirmPassword.set('');
      this.passwordTouched.set(false);
      this.passwordSaved.set(true);
    } catch (err) {
      this.passwordErrors.set(extractErrors(err, 'Could not change your password.'));
    } finally {
      this.passwordSaving.set(false);
    }
  }

  private showResetMessage(type: 'success' | 'error', text: string) {
    clearTimeout(this.resetTimer);
    this.resetMessage.set({ type, text });
    this.resetTimer = setTimeout(() => this.resetMessage.set(null), 5000);
  }

  async resetPasswordAdmin(user: UserList) {
    const ok = await this.confirm.confirm({
      title: 'اعادة تعيين كلمة المرور',
      message: ` سيتم اعادة تعيين كلمة مرور ${user.fullName} الي 'P@ssw0rd'. هل تريد المتابعة؟`,
      confirmText: 'اعادة تعيين',
      danger: true,
    });
    if (!ok) return;

    this.resettingUserId.set(user.userId);
    try {
      await this.account.resetPasswordAdmin({ userId: user.userId });
      this.showResetMessage('success', `تمت إعادة تعيين كلمة مرور ${user.fullName} بنجاح`);
    } catch (err) {
      const msgs = extractErrors(err, 'تعذرت إعادة تعيين كلمة المرور');
      this.showResetMessage('error', msgs.join(' '));
    } finally {
      this.resettingUserId.set(null);
    }
  }
  onInput(target: { set(v: string): void }, event: Event) {
    target.set((event.target as HTMLInputElement).value);
  }
}
 