// shared/utils/api.ts
import { HttpErrorResponse } from '@angular/common/http';
import { ApiResponse } from '../models/api-response.model';

/** Use inside map(): returns data, or throws the envelope if succeeded is false. */
export function unwrap<T>(res: ApiResponse<T>): T {
  if (!res.succeeded) throw res;
  return res.data;
}

/** Extracts a readable message from either a failed HTTP response or a thrown envelope. */
export function apiError(err: unknown, fallback: string): string {
  const body = err instanceof HttpErrorResponse ? err.error : err;
  const errors = (body as Partial<ApiResponse<unknown>> | null)?.errors;
  return Array.isArray(errors) && errors.length ? errors.join(' - ') : fallback;
}