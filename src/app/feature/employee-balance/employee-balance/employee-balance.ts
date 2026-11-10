// employee-balance/employee-balance.ts
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeBalanceService } from '../employee-balance.service';
import { EmployeeBalance, MOVEMENT_LABELS } from '../employee-balance.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { AuthService } from '../../../core/services/AuthService/auth'; 
import { exportFile } from '../../../shared/utils/download';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-employee-balance',
  imports: [FormsModule, DecimalPipe, DatePipe],
  templateUrl: './employee-balance.html',
})
export class EmployeeBalancePage {
  private service = inject(EmployeeBalanceService);
  private auth = inject(AuthService);
  lookup = inject(LookupService);
  
  private qp = inject(ActivatedRoute).snapshot.queryParamMap;

  labels = MOVEMENT_LABELS;

  // ASSUMPTION: the same AuthService members as the payroll review page
  isAdmin = computed(() => !!this.auth.isAdmin());

  employees = signal<{ id: number; name: string }[]>([]);
  employeeId = signal(0);
  from = signal(today().slice(0, 8) + '01');      // first day of this month
  to = signal(today());

  data = signal<EmployeeBalance | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  exporting = signal(false);
  exportError = signal<string | null>(null);

  constructor() {
    if (this.isAdmin()) {
      this.lookup.employees().subscribe(e => this.employees.set(e));
    } else {
      this.employeeId.set(Number(this.qp.get('employeeId')) ||  Number(this.auth.employeeId()) || 0);   // lookups are admin-only, so no list
      this.load();
    }
     if(this.qp.get('employeeId')){ this.employeeId.set(Number(this.qp.get('employeeId'))) }
     this.load();
  }

  load() {
    if (!this.employeeId()) { this.error.set('اختر الموظف'); return; }
    if (this.from() && this.to() && this.to() < this.from()) { this.error.set('تاريخ النهاية قبل البداية'); return; }

    this.loading.set(true); this.error.set(null); this.exportError.set(null);
    this.service.get(this.employeeId(), this.from(), this.to()).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: err => { this.error.set(apiError(err, 'فشل تحميل الرصيد')); this.loading.set(false); },
    });
  }

  allPeriods() { this.from.set(''); this.to.set(''); this.load(); }

  exportExcel() {
    if (!this.employeeId()) return;
    exportFile(this.service.export(this.employeeId(), this.from(), this.to()),
      `employee-balance-${this.employeeId()}-${today()}.xlsx`,
      { busy: this.exporting, error: this.exportError });
  }
}