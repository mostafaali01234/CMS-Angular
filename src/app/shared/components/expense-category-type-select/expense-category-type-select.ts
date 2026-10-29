// shared/components/expense-category-type-select/expense-category-type-select.ts
import { Component, computed, forwardRef, inject, input, OnInit, output, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LookupService } from '../../services/lookup.service';
import { ExpenseTypeOption, LookupItem } from '../../models/lookup.model';

@Component({
  selector: 'expense-category-type-select',
  imports: [FormsModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ExpenseCategoryTypeSelect), multi: true },
  ],
  templateUrl: './expense-category-type-select.html',
  styles: [':host { display: contents; }'],   // the two fields flow into the parent's grid or flex row
})
export class ExpenseCategoryTypeSelect implements ControlValueAccessor, OnInit {
  private lookup = inject(LookupService);
  private static nextId = 0;
  uid = ExpenseCategoryTypeSelect.nextId++;

  invalid = input(false);
  inline = input(false);            // compact fields for a filter bar
  anyCategory = input(false);       // the type list works without a category (filters)

  categoryLabel = input('التصنيف');
  typeLabel = input('اسم المصروف');
  categoryPlaceholder = input('اختر التصنيف');
  typePlaceholder = input('اختر اسم المصروف');
  typeLockedPlaceholder = input('اختر التصنيف أولاً');
  categoryError = input('اختر التصنيف');
  typeError = input('اختر اسم المصروف');

  /** emits the chosen category, before the type change, so a list can set both before it searches */
  categoryChange = output<number>();

  categories = signal<LookupItem[]>([]);
  types = signal<ExpenseTypeOption[]>([]);
  categoryId = signal(0);
  typeId = signal(0);
  disabled = signal(false);
  loaded = signal(false);

  filteredTypes = computed(() => {
    const cat = this.categoryId();
    const list = cat
      ? this.types().filter(t => t.category_id === cat)
      : this.anyCategory() ? this.types() : [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  });

  typeDisabled = computed(() => this.disabled() || (!this.categoryId() && !this.anyCategory()));

  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    forkJoin({
      categories: this.lookup.getExpenseCategories(),
      types: this.lookup.getExpenseTypes(),
    }).subscribe(({ categories, types }) => {
      this.categories.set(categories);
      this.types.set(types);
      this.loaded.set(true);
      this.syncCategory();
    });
  }

  // --- ControlValueAccessor ---
  writeValue(value: number | null) {
    this.typeId.set(value ?? 0);
    if (!value) this.categoryId.set(0);
    else this.syncCategory();
  }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean) { this.disabled.set(isDisabled); }

  // --- UI events ---
  onCategoryChange(id: number) {
    this.categoryId.set(id);
    this.typeId.set(0);              // the previous type belongs to another category
    this.categoryChange.emit(id);
    this.onChange(0);
    this.onTouched();
  }

  onTypeChange(id: number) {
    this.typeId.set(id);
    if (id && !this.categoryId()) {  // chosen without a category: take the type's category
      const cat = this.types().find(t => t.id === id)?.category_id ?? 0;
      this.categoryId.set(cat);
      this.categoryChange.emit(cat);
    }
    this.onChange(id);
  }

  touched() { this.onTouched(); }

  // derive the category from the selected type (edit mode)
  private syncCategory() {
    if (!this.loaded() || !this.typeId()) return;
    const type = this.types().find(t => t.id === this.typeId());
    if (type) this.categoryId.set(type.category_id ?? 0);
  }
}