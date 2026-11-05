// techs-editor/techs-editor.ts
import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isLead, TECH_TYPES, TechRow } from '../shift.model';

@Component({
  selector: 'app-techs-editor',
  imports: [FormsModule],
  template: `
    @for (t of techs(); track $index; let i = $index) {
      <div style="display: flex; gap: 6px; margin-bottom: 6px">
        <select class="ui-input" style="width:30%;" [disabled]="disabled()" [ngModel]="t.tech_type" (ngModelChange)="set(i, { tech_type: $event })">
          @for (x of types; track x.value) {
            <option [value]="x.value" [disabled]="leadTaken(i) && isLead(x.value)">{{ x.label }}</option>
          }
        </select>
        <select class="ui-input" style="flex: 1" [disabled]="disabled()" [ngModel]="t.tech_id" (ngModelChange)="set(i, { tech_id: +$event })">
          <option [ngValue]="0">اختر</option>
          @for (e of employees(); track e.id) { <option [ngValue]="e.id">{{ e.name }}</option> }
        </select>
        @if (!disabled()) {
          <button type="button" class="ui-btn ui-btn-danger sm" [disabled]="techs().length === 1" (click)="remove(i)">×</button>
        }
      </div>
    }
    @if (!disabled()) { <button type="button" class="ui-btn ui-btn-outline sm" (click)="add()">+ موظف</button> }
  `,
})
export class TechsEditor {
  techs = model.required<TechRow[]>();
  employees = input.required<{ id: number; name: string }[]>();
  disabled = input(false);
  types = TECH_TYPES;
  isLead = isLead;

  leadTaken(i: number) { return this.techs().some((t, k) => k !== i && isLead(t.tech_type)); }
  add() { this.techs.update(t => [...t, { id: 0, tech_id: 0, tech_type: 'Helper' }]); }
  remove(i: number) { this.techs.update(t => t.filter((_, k) => k !== i)); }
  set(i: number, p: Partial<TechRow>) { this.techs.update(t => t.map((x, k) => (k === i ? { ...x, ...p } : x))); }
}