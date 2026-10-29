// shared/components/order-status/order-status.ts
import { Component, computed, input } from '@angular/core';

// the enum names the server sends
const KEYS: Record<string, string> = {
  'جديد': 'new',
  'قيد_التنفيذ': 'progress',
  'تم_التركيب': 'installed',
  'تام': 'done',
  'مؤجل': 'postponed',
  'ملغي': 'canceled',
  'محذوف': 'deleted',
};

@Component({
  selector: 'app-order-status',
  template: `
    @if (text()) {
      <span class="st" [attr.data-s]="key()"><i class="dot"></i>{{ text() }}</span>
    }
  `,
  styles: [`
    :host { display: inline-block; }

    .st {
      --c: #757575;
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 11px; border-radius: 999px;
      font-size: .85em; font-weight: 600; white-space: nowrap; line-height: 1.5;
      color: var(--c);
      background: color-mix(in srgb, var(--c) 14%, transparent);
      border: 1px solid color-mix(in srgb, var(--c) 40%, transparent);
    }
    .dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }

    /* colours */
    [data-s='new']       { --c: #1e88e5; }
    [data-s='progress']  { --c: #e08600; }
    [data-s='installed'] { --c: #0e9aa7; }
    [data-s='done']      { --c: #2e9e4f; }
    [data-s='postponed'] { --c: #7e57c2; }
    [data-s='canceled']  { --c: #d32f2f; }
    [data-s='deleted']   { --c: #ff0000; }

    /* live statuses pulse */
    [data-s='new'] .dot      { animation: pulse 1.8s ease-out infinite; }
    [data-s='progress'] .dot { animation: pulse 1s ease-out infinite; }
    @keyframes pulse {
      0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--c) 60%, transparent); }
      70%  { box-shadow: 0 0 0 7px transparent; }
      100% { box-shadow: 0 0 0 0 transparent; }
    }

    /* finished: solid, so it stands out in a long table */
    [data-s='done'] { color: #fff; background: var(--c); border-color: var(--c); }

    /* statuses that show a symbol instead of the dot */
    [data-s='done'] .dot, [data-s='installed'] .dot, [data-s='postponed'] .dot, [data-s='canceled'] .dot {
      width: auto; height: auto; background: transparent; font-style: normal; line-height: 1;
    }
    [data-s='done'] .dot::before      { content: '✓'; }
    [data-s='installed'] .dot::before { content: '✔'; }
    [data-s='postponed'] .dot::before { content: '⏸'; }
    [data-s='canceled'] .dot::before  { content: '✕'; }

    [data-s='postponed'] { border-style: dashed; }
    [data-s='deleted']   { opacity: 1; }

    @media (prefers-reduced-motion: reduce) { .dot { animation: none !important; } }
  `],
})
export class OrderStatus {
  status = input<string | null | undefined>('');
  key = computed(() => KEYS[this.status() ?? ''] ?? 'other');
  text = computed(() => (this.status() ?? '').replace(/_/g, ' '));
}