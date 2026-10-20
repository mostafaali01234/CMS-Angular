// shared/components/search-select/search-select.ts
import {
  Component, computed, DestroyRef, forwardRef, inject, input, OnInit, output, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { LookupItem } from '../../models/lookup.model';

// makes Arabic search forgiving: أ/إ/آ = ا, ة = ه, ى = ي, no diacritics, Arabic digits = 0-9
const norm = (s: string) =>
  s.toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660));

@Component({
  selector: 'app-search-select',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SearchSelect), multi: true },
  ],
  templateUrl: './search-select.html',
  styles: [`
    :host { display: contents; }
    .ss-box { position: relative; }
    .ss-clear { position: absolute; inset-inline-end: 8px; top: 50%; transform: translateY(-50%);
                border: 0; background: none; cursor: pointer; font-size: 18px; line-height: 1; color: inherit; opacity: .6; }
    .ss-list { position: absolute; inset-inline: 0; top: 100%; z-index: 30; margin: 4px 0 0; padding: 4px;
               list-style: none; max-height: 240px; overflow: auto; background: Canvas; color: CanvasText;
               border: 1px solid rgba(128,128,128,.4); border-radius: 8px; box-shadow: 0 6px 18px rgba(0,0,0,.15); }
    .ss-list li { padding: 8px 10px; border-radius: 6px; cursor: pointer; }
    .ss-list li.active { background: rgba(128,128,128,.18); }
    .ss-empty { opacity: .6; cursor: default !important; }
  `],
})
export class SearchSelect<T extends LookupItem = LookupItem> implements ControlValueAccessor, OnInit {
  private destroyRef = inject(DestroyRef);
  private static nextId = 0;
  uid = SearchSelect.nextId++;

  loader = input.required<() => Observable<T[]>>();
  display = input<(item: T) => string>(i => i.name);
  searchText = input<((item: T) => string) | undefined>(undefined);   // defaults to display
  filter = input<((item: T) => boolean) | undefined>(undefined);

  label = input('');
  placeholder = input('ابحث...');
  error = input('هذا الحقل مطلوب');
  invalid = input(false);

  picked = output<T>();

  items = signal<T[]>([]);
  value = signal(0);
  query = signal('');
  open = signal(false);
  active = signal(0);
  disabled = signal(false);
  loadFailed = signal(false);

  selected = computed(() => this.items().find(i => i.id === this.value()));

  shown = computed(() => {
    if (this.open()) return this.query();
    const s = this.selected();
    return s ? this.display()(s) : '';
  });

  results = computed(() => {
    const f = this.filter();
    const text = this.searchText() ?? this.display();
    const q = norm(this.query().trim());
    let list = f ? this.items().filter(i => f(i) || i.id === this.value()) : this.items();
    if (q) list = list.filter(i => norm(text(i)).includes(q));
    return list.slice(0, 50);
  });

  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    this.loader()()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => this.items.set(list),
        error: () => this.loadFailed.set(true),
      });
  }

  openList() {
    if (this.disabled()) return;
    this.query.set('');
    this.active.set(0);
    this.open.set(true);
  }

  close() {
    this.open.set(false);
    this.onTouched();
  }

  onInput(text: string) {
    this.query.set(text);
    this.active.set(0);
    this.open.set(true);
  }

  onKey(e: KeyboardEvent) {
    const n = this.results().length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!this.open()) this.openList();
      else this.active.update(i => Math.min(i + 1, n - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.active.update(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && this.open()) {
      e.preventDefault();               // don't submit the form
      const o = this.results()[this.active()];
      if (o) this.choose(o);
    } else if (e.key === 'Escape') {
      this.close();
    }
  }

  choose(o: T) {
    this.value.set(o.id);
    this.onChange(o.id);
    this.picked.emit(o);
    this.open.set(false);
  }

  clear() {
    this.value.set(0);
    this.onChange(0);
  }

  // --- ControlValueAccessor ---
  writeValue(v: number | null) { this.value.set(v ?? 0); }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(d: boolean) { this.disabled.set(d); }
}