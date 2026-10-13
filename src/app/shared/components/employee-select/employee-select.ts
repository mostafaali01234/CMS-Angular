// shared/components/employee-select/employee-select.ts
import { Component, computed, forwardRef, inject, input, OnInit, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LookupService } from '../../services/lookup.service';
import { EmployeeOption } from '../../models/lookup.model';

@Component({
  selector: 'app-employee-select',
  imports: [FormsModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => EmployeeSelect), multi: true },
  ],
  templateUrl: './employee-select.html',
  styles: [':host { display: contents; }'],
})
export class EmployeeSelect implements ControlValueAccessor, OnInit {
  private lookup = inject(LookupService);
  private static nextId = 0;
  uid = EmployeeSelect.nextId++;

  label = input('الموظف');
  placeholder = input('اختر الموظف');
  error = input('اختر الموظف');
  invalid = input(false);
  onlyActive = input(true);

  employees = signal<EmployeeOption[]>([]);
  value = signal(0);
  disabled = signal(false);
  loadFailed = signal(false);

  // keep the currently selected employee visible even if they are inactive now
  options = computed(() =>
    this.employees().filter(e => !this.onlyActive() || e.active || e.id === this.value()),
  );

  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    this.lookup.getEmployees().subscribe({
      next: list => this.employees.set(list),
      error: () => this.loadFailed.set(true),
    });
  }

  // --- ControlValueAccessor ---
  writeValue(v: number | null) { this.value.set(v ?? 0); }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean) { this.disabled.set(isDisabled); }

  select(id: number) {
    this.value.set(id);
    this.onChange(id);
  }

  touched() { this.onTouched(); }
}