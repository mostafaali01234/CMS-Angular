// shared/utils/params.ts
import { HttpParams } from '@angular/common/http';

/** query params without the empty ones ('' / 0 / null mean "all") */
export function toParams(obj: object): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === '' || v === 0 || v == null) continue;
    p = p.set(k, String(v));
  }
  return p;
}