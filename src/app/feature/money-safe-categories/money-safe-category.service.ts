// money-safe-category.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { LookupService } from '../../shared/services/lookup.service';
import { MoneySafeCategory } from './money-safe-category.model';

@Injectable({ providedIn: 'root' })
export class MoneySafeCategoryService {
  private http = inject(HttpClient);
  private lookup = inject(LookupService);
  private baseUrl = `${environment.apiUrl}/moneySafeCategory`;

  getAll(): Observable<MoneySafeCategory[]> {
    return this.http.get<ApiResponse<MoneySafeCategory[]>>(this.baseUrl).pipe(map(unwrap));
  }

  getById(id: number): Observable<MoneySafeCategory> {
    return this.http.get<ApiResponse<MoneySafeCategory>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  create(cat: MoneySafeCategory): Observable<MoneySafeCategory> {
    return this.http.post<ApiResponse<MoneySafeCategory>>(this.baseUrl, cat).pipe(
      map(unwrap),
      tap(() => this.lookup.clear('moneySafeCategories')));
  }

  update(id: number, cat: MoneySafeCategory): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, cat).pipe(
      tap(() => this.lookup.clear('moneySafeCategories')));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.lookup.clear('moneySafeCategories')));
  }
}