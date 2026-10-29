// shared/components/lookup-select/lookup-select.ts
import {
  Component, computed, DestroyRef, forwardRef, inject, input, OnInit, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { LookupItem } from '../../models/lookup.model';

@Component({
  selector: 'app-lookup-select',
  imports: [FormsModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LookupSelect), multi: true },
  ],
  templateUrl: './lookup-select.html',
  styles: [':host { display: contents; }'],
})
export class LookupSelect<T extends LookupItem = LookupItem> implements ControlValueAccessor, OnInit {
  private destroyRef = inject(DestroyRef);
  private static nextId = 0;
  uid = LookupSelect.nextId++;

  loader = input.required<() => Observable<T[]>>();
  filter = input<((item: T) => boolean) | undefined>(undefined);   // e.g. activeOnly
  display = input<(item: T) => string>(item => item.name);          // option text

  label = input('');
  placeholder = input('اختر');
  error = input('هذا الحقل مطلوب');
  invalid = input(false);

  items = signal<T[]>([]);
  value = signal(0);
  disabled = signal(false);
  loadFailed = signal(false);
  showPlaceholder = input(true);

  // the currently selected item stays visible even if the filter would hide it
  options = computed(() => {
    const f = this.filter();
    return f ? this.items().filter(i => f(i) || i.id === this.value()) : this.items();
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

  // --- ControlValueAccessor ---
  writeValue(v: number | null) { this.value.set(v ?? 0); }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledCategory(isDisabled: boolean) { this.disabled.set(isDisabled); }

  select(id: number) {
    this.value.set(id);
    this.onChange(id);
  }

  touched() { this.onTouched(); }
}