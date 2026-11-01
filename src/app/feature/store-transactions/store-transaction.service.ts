// store-transaction.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { Paged } from '../../shared/models/paged.model';
import { unwrap } from '../../shared/utils/api';
import { toParams } from '../../shared/utils/params';
import { SaveStoreTransaction, StoreTransaction, StoreTransactionQuery } from './store-transaction.model';

@Injectable({ providedIn: 'root' })
export class StoreTransactionService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/storeTransaction`;

  getPaged(q: StoreTransactionQuery): Observable<Paged<StoreTransaction>> {
    return this.http
      .get<ApiResponse<Paged<StoreTransaction>>>(`${this.baseUrl}/paged`, { params: toParams(q) })
      .pipe(map(unwrap));
  }

  getById(id: number): Observable<StoreTransaction> {
    return this.http.get<ApiResponse<StoreTransaction>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  create(t: SaveStoreTransaction): Observable<StoreTransaction> {
    return this.http.post<ApiResponse<StoreTransaction>>(this.baseUrl, t).pipe(map(unwrap));
  }

  update(id: number, t: SaveStoreTransaction): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, t);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}