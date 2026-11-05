// shared/utils/api.ts
import { HttpErrorResponse } from '@angular/common/http';
import { ApiResponse } from '../models/api-response.model';

/** Use inside map(): returns data, or throws the envelope if succeeded is false. */
export function unwrap<T>(res: ApiResponse<T>): T {
  if (!res.succeeded) throw res;
  return res.data;
}

/** Extracts a readable message from either a failed HTTP response or a thrown envelope. */
// export function apiError(err: unknown, fallback: string): string {
//   const body = err instanceof HttpErrorResponse ? err.error : err;
//   const errors = (body as Partial<ApiResponse<unknown>> | null)?.errors;
//   return Array.isArray(errors) && errors.length ? errors.join(' - ') : fallback;
// }

export function apiError(err: unknown, fallback: string): string {
  const body = err instanceof HttpErrorResponse ? err.error : err;

  // 1. Your ApiResponse envelope
  const errors = (body as Partial<ApiResponse<unknown>> | null)?.errors;
  if (Array.isArray(errors) && errors.length) return errors.join(' - ');

  // 2. ProblemDetails (RFC 9110), e.g. the stock-quantity error
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;

  // 3. Plain-text body
  if (typeof body === 'string' && body.trim()) return body;

  return fallback;
}