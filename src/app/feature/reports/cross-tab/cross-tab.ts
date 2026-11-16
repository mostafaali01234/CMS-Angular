// cross-tab/cross-tab.ts  — the rows x columns table of the monthly sales and the category reports
import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CrossTab } from '../report.model';

@Component({
  selector: 'app-cross-tab',
  imports: [DecimalPipe],
  templateUrl: './cross-tab.html',
})
export class CrossTabTable {
  data = input<CrossTab | null>(null);
  digits = computed(() => (this.data()?.measure === 'amount' ? '1.0-2' : '1.0-0'));
}
