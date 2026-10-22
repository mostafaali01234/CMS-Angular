// shared/components/state-city-select/state-city-select.ts
import { Component, computed, forwardRef, inject, input, OnInit, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LookupService } from '../../services/lookup.service';
import { City, CountryState } from '../../models/lookup.model';

@Component({
  selector: 'app-state-city-select',
  imports: [FormsModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StateCitySelect), multi: true },
  ],
  templateUrl: './state-city-select.html',
  styles: [':host { display: contents; }'], // fields flow into the parent's .ui-grid
})
export class StateCitySelect implements ControlValueAccessor, OnInit {
  private lookup = inject(LookupService);
  private static nextId = 0;
  uid = StateCitySelect.nextId++;

  invalid = input(false);
  stateLabel = input('المحافظة');
  cityLabel = input('المدينة');
  stateError = input('اختر المحافظة');
  cityError = input('اختر مدينة');

  states = signal<CountryState[]>([]);
  cities = signal<City[]>([]);
  stateId = signal(0);
  cityId = signal(0);
  disabled = signal(false);
  loaded = signal(false);

  filteredCities = computed(() => this.cities().filter(c => c.state_id === this.stateId()));

  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    forkJoin({ states: this.lookup.getStates(), cities: this.lookup.getCities() }).subscribe(
      ({ states, cities }) => {
        this.states.set(states);
        this.cities.set(cities);
        this.loaded.set(true);
        this.syncState();
      },
    );
  }

  // --- ControlValueAccessor ---
  writeValue(value: number | null) {
    this.cityId.set(value ?? 0);
    if (!value) this.stateId.set(0);
    else this.syncState();
  }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean) { this.disabled.set(isDisabled); }

  // --- UI events ---
  onStateChange(id: number) {
    this.stateId.set(id);
    this.cityId.set(0);   // previous city belongs to another state
    this.onChange(0);
  }
  
  setLocation(stateId: number, cityId: number) {
    // if the customer has no state, derive it from the city
    const state = stateId || this.cities().find(c => c.id === cityId)?.state_id || 0;

    this.stateId.set(state);   // 1. state first: the city list for this state is built
    this.cityId.set(0);

    setTimeout(() => {         // 2. once the cities have rendered, select the customer's city
      this.cityId.set(cityId);
      this.onChange(cityId);   // also updates the form's city_id
    });
  }

  onCityChange(id: number) {
    this.cityId.set(id);
    this.onChange(id);
  }

  touched() { this.onTouched(); }

  // derive the state from the selected city (edit mode)
  private syncState() {
    if (!this.loaded() || !this.cityId()) return;
    const city = this.cities().find(c => c.id === this.cityId());
    if (city) this.stateId.set(city.state_id);
  }
}