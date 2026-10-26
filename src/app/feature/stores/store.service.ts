// store.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { LookupService } from '../../shared/services/lookup.service';
import { SaveStore, Store } from './store.model';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private http = inject(HttpClient);
  private lookup = inject(LookupService);
  private baseUrl = `${environment.apiUrl}/store`;

  getAll(): Observable<Store[]> {
    return this.http.get<ApiResponse<Store[]>>(this.baseUrl).pipe(map(unwrap));
  }

  getById(id: number): Observable<Store> {
    return this.http.get<ApiResponse<Store>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  create(store: SaveStore): Observable<Store> {
    return this.http.post<ApiResponse<Store>>(this.baseUrl, store).pipe(
      map(unwrap),
      tap(() => this.lookup.clear('stores')));
  }

  update(id: number, store: SaveStore): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, store).pipe(
      tap(() => this.lookup.clear('stores')));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.lookup.clear('stores')));
  }
}