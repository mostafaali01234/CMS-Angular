// shared/utils/local-list.ts
import { computed, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { apiError } from './api';

/**
 * Same shape as pagedList(), for endpoints that return the whole list at once:
 * the filters and the paging run in the browser. Templates can use it exactly like pagedList.
 */
export function localList<T, F extends object>(
  fetch: () => Observable<T[]>,
  matches: (item: T, filter: F) => boolean,
  initial: () => F,
  options: { pageSize?: number; sort?: (a: T, b: T) => number; errorText?: string } = {},
) {
  const { pageSize = 20, sort, errorText = 'فشل التحميل' } = options;

  const form = signal<F>(initial());       // what is typed in the filters
  const applied = signal<F>(initial());    // what the table is showing
  const pageNo = signal(1);
  const size = signal(pageSize);
  const all = signal<T[]>([]);
  const loading = signal(true);
  const error = signal<string | null>(null);
  let sub: Subscription | undefined;

  const filtered = computed(() => {
    const f = applied();
    const rows = all().filter(i => matches(i, f));
    return sort ? [...rows].sort(sort) : rows;
  });
  const total = computed(() => filtered().length);
  const pages = computed(() => Math.max(1, Math.ceil(total() / size())));
  const page = computed(() => Math.min(pageNo(), pages()));   // a page that no longer exists (after a delete) is clamped
  const items = computed(() => {
    const start = (page() - 1) * size();
    return filtered().slice(start, start + size());
  });

  const load = () => {
    sub?.unsubscribe();
    loading.set(true);
    error.set(null);
    sub = fetch().subscribe({
      next: rows => { all.set(rows); loading.set(false); },
      error: err => { error.set(apiError(err, errorText)); loading.set(false); },
    });
  };

  const search = () => { applied.set({ ...form() }); pageNo.set(1); };

  return {
    form, applied, page, size, items, total, filtered, loading, error, pages,

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
    goTo(p: number) { pageNo.set(p); },
    setSize(n: number) { size.set(n); pageNo.set(1); },
    reload: load,
  };
}
