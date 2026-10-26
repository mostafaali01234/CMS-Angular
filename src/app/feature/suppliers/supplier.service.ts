// supplier.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { LookupService } from '../../shared/services/lookup.service';
import { SaveSupplier, Supplier } from './supplier.model';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private http = inject(HttpClient);
  private lookup = inject(LookupService);
  private baseUrl = `${environment.apiUrl}/supplier`;

  getAll(): Observable<Supplier[]> {
    return this.http.get<ApiResponse<Supplier[]>>(this.baseUrl).pipe(map(unwrap));
  }

  getById(id: number): Observable<Supplier> {
    return this.http.get<ApiResponse<Supplier>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  create(supplier: SaveSupplier): Observable<Supplier> {
    return this.http.post<ApiResponse<Supplier>>(this.baseUrl, supplier).pipe(
      map(unwrap),
      tap(() => this.lookup.clear('suppliers')));
  }

  update(id: number, supplier: SaveSupplier): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, supplier).pipe(
      tap(() => this.lookup.clear('suppliers')));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.lookup.clear('suppliers')));
  }
}