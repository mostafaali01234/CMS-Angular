// payroll-withdraw/payroll-withdraw.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../payroll.service';
import { Payroll, statusLabel } from '../payroll.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { AuthService } from '../../../core/services/AuthService/auth'; 
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-payroll-withdraw',
  imports: [FormsModule, RouterLink, DecimalPipe, LookupSelect],
  templateUrl: './payroll-withdraw.html',
})
export class PayrollWithdraw implements OnInit {
  private service = inject(PayrollService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  lookup = inject(LookupService);
  activeOnly = activeOnly;
  statusLabel = statusLabel;

  payroll = signal<Payroll | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  moneySafeId = signal(0);
  date = signal(today());

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: p => { this.payroll.set(p); this.loading.set(false); },
      error: err => { this.error.set(apiError(err, 'فشل تحميل المرتب')); this.loading.set(false); },
    });
  }

  save() {
    const p = this.payroll()!;
    if (!this.moneySafeId()) { this.error.set('اختر الخزنة'); return; }
    this.saving.set(true); this.error.set(null);
    this.service.withdraw(p.id, {
      money_safe_id: this.moneySafeId(), withdrawn_by_id: Number(this.auth.employeeId()) || 0, date: this.date(),
    }).subscribe({
      next: () => this.router.navigate(['/payroll']),
      error: err => { this.error.set(apiError(err, 'فشل صرف المرتب')); this.saving.set(false); },
    });
  }
}