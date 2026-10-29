// shared/utils/paged-list.ts
import { computed, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Paged, PageQuery } from '../models/paged.model';
import { apiError } from './api';

/**
 * State of a server-paged list page: filters, page, rows and totals.
 * `initial` is a function so defaults like "today" are evaluated when the page opens.
 */
export function pagedList<T, F extends object, S = unknown>(
  fetch: (q: F & PageQuery) => Observable<Paged<T, S>>,
  initial: () => F,
  pageSize = 20,
  errorText = 'فشل التحميل',
) {
  const form = signal<F>(initial());       // what is typed in the filters
  const applied = signal<F>(initial());    // what the table is showing
  const page = signal(1);
  const size = signal(pageSize);
  const items = signal<T[]>([]);
  const total = signal(0);
  const summary = signal<S | undefined>(undefined);
  const loading = signal(true);
  const error = signal<string | null>(null);
  let sub: Subscription | undefined;

  const load = () => {
    sub?.unsubscribe();                    // a slow old response can't overwrite a newer one
    loading.set(true);
    error.set(null);
    sub = fetch({ ...applied(), page: page(), pageSize: size() } as F & PageQuery).subscribe({
      next: r => {
        items.set(r.items);
        total.set(r.total);
        page.set(r.page);                  // the server clamps a page that no longer exists
        summary.set(r.summary);
        loading.set(false);
      },
      error: err => { error.set(apiError(err, errorText)); loading.set(false); },
    });
  };

  const search = () => { applied.set({ ...form() }); page.set(1); load(); };

  return {
    form, applied, page, size, items, total, summary, loading, error,
    pages: computed(() => Math.max(1, Math.ceil(total() / size()))),

    /** change one filter; `apply` runs the search straight away (selects and dates) */
    set<K extends keyof F>(key: K, value: F[K], apply = false) {
      form.update(f => ({ ...f, [key]: value }));
      if (apply) search();
    },
    patch(values: Partial<F>, apply = false) {
      form.update(f => ({ ...f, ...values }));
      if (apply) search();
    },
    search,
    reset() { form.set(initial()); search(); },
    goTo(p: number) { page.set(p); load(); },
    setSize(n: number) { size.set(n); page.set(1); load(); },
    reload: load,
  };
}