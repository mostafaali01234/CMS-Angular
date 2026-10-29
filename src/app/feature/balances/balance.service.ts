// balance.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { PartyBalance, PartyKind, Statement } from './balance.model';

@Injectable({ providedIn: 'root' })
export class BalanceService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/balance`;

  getBalances(kind: PartyKind): Observable<PartyBalance[]> {
    return this.http.get<ApiResponse<PartyBalance[]>>(`${this.baseUrl}/${kind}`).pipe(map(unwrap));
  }

  getStatement(kind: PartyKind, id: number, from: string, to: string): Observable<Statement> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<ApiResponse<Statement>>(`${this.baseUrl}/${kind}/${id}`, { params }).pipe(map(unwrap));
  }
}