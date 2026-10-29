// balance-list/balance-list.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BalanceService } from '../balance.service';
import { PartyBalance, PartyKind, sideLabel } from '../balance.model';
import { apiError } from '../../../shared/utils/api';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

@Component({
  selector: 'app-balance-list',
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './balance-list.html',
})
export class BalanceList implements OnInit {
  private service = inject(BalanceService);
  kind: PartyKind = inject(ActivatedRoute).snapshot.data['kind'];
  isCustomer = this.kind === 'customer';
  side = (b: number) => sideLabel(this.kind, b);

  rows = signal<PartyBalance[]>([]);
  search = signal('');
  onlyNonZero = signal(true);
  loading = signal(true);
  error = signal<string | null>(null);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.rows()
      .filter(r => !this.onlyNonZero() || r.balance !== 0 || r.balance_currency !== 0)
      .filter(r => !q || r.name.toLowerCase().includes(q) || (r.phone ?? '').toLowerCase().includes(q))
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  });

  // positive and negative balances are shown apart, since adding them up hides what is owed
  positive = computed(() => round2(this.filtered().filter(r => r.balance > 0).reduce((s, r) => s + r.balance, 0)));
  negative = computed(() => round2(this.filtered().filter(r => r.balance < 0).reduce((s, r) => s + r.balance, 0)));
  positiveCur = computed(() => round2(this.filtered().filter(r => r.balance_currency > 0).reduce((s, r) => s + r.balance_currency, 0)));
  negativeCur = computed(() => round2(this.filtered().filter(r => r.balance_currency < 0).reduce((s, r) => s + r.balance_currency, 0)));

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.service.getBalances(this.kind).subscribe({
      next: data => { this.rows.set(data); this.loading.set(false); },
      error: err => { this.error.set(apiError(err, 'فشل تحميل الارصدة')); this.loading.set(false); },
    });
  }
}