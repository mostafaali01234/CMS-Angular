// shared/components/pager/pager.ts
import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pager',
  templateUrl: './pager.html',
})
export class Pager {
  page = input.required<number>();
  pageSize = input.required<number>();
  total = input.required<number>();
  pageChange = output<number>();
  sizeChange = output<number>();

  sizes = [20, 50, 100];
  pages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  from = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  to = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  // 1 … 4 5 6 … 20  (0 = the gap)
  window = computed(() => {
    const n = this.pages();
    const c = this.page();
    if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1);
    const nums = [...new Set([1, n, c - 1, c, c + 1])].filter(x => x >= 1 && x <= n).sort((a, b) => a - b);
    const out: number[] = [];
    nums.forEach((x, i) => {
      if (i > 0 && x - nums[i - 1] > 1) out.push(0);
      out.push(x);
    });
    return out;
  });
}