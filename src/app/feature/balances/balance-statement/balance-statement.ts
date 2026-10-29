// balance-statement/balance-statement.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BalanceService } from '../balance.service';
import { KIND_LABELS, PartyKind, sideLabel, Statement, StatementLine } from '../balance.model';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-balance-statement',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './balance-statement.html',
})
export class BalanceStatement implements OnInit {
  private service = inject(BalanceService);
  private route = inject(ActivatedRoute);

  kind: PartyKind = this.route.snapshot.data['kind'];
  isCustomer = this.kind === 'customer';
  partyId = Number(this.route.snapshot.paramMap.get('id'));
  listLink = ['/balances', this.isCustomer ? 'customers' : 'suppliers'];
  side = (b: number) => sideLabel(this.kind, b);
  kindLabel = (k: string) => KIND_LABELS[k] ?? k;

  // an invoice increases what the customer owes (debit) but what we owe a supplier (credit)
  increaseLabel = this.isCustomer ? 'مدين' : 'دائن';
  decreaseLabel = this.isCustomer ? 'دائن' : 'مدين';

  statement = signal<Statement | null>(null);
  from = signal('');
  to = signal('');
  loading = signal(true);
  error = signal<string | null>(null);

  hasCurrency = computed(() => {
    const s = this.statement();
    return !!s && (s.opening_balance_currency !== 0 || s.lines.some(l =>
      l.increase_currency || l.decrease_currency));
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.service.getStatement(this.kind, this.partyId, this.from(), this.to()).subscribe({
      next: s => { this.statement.set(s); this.loading.set(false); },
      error: err => { this.error.set(apiError(err, 'فشل تحميل كشف الحساب')); this.loading.set(false); },
    });
  }

  clearDates() { this.from.set(''); this.to.set(''); this.load(); }

  /** where a line's document opens */
  link(l: StatementLine): any[] | null {
    const base = this.isCustomer ? '/sale-invoices' : '/buy-invoices';
    if (l.kind === 'invoice') return [base, l.id, 'edit'];
    if (l.kind === 'return') return [base, 'returns', l.id, 'edit'];
    if (l.ref_id) return l.kind === 'refund' ? [base, 'returns', l.ref_id, 'edit'] : [base, l.ref_id, 'edit'];
    return null;
  }

  print() { window.print(); }
}