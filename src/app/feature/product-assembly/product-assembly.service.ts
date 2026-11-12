// product-assembly.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { LookupItem } from '../../shared/models/lookup.model';
import { unwrap } from '../../shared/utils/api';
import {
  AssemblyDefinition, AssemblyOperation, SaveAssemblyDefinition, SaveAssemblyOperation,
} from './product-assembly.model';

@Injectable({ providedIn: 'root' })
export class ProductAssemblyService {
  private http = inject(HttpClient);
  private definitionUrl = `${environment.apiUrl}/productAssemblyDefinition`;
  private operationUrl = `${environment.apiUrl}/productAssemblyOperation`;

  // ---------- definitions (keyed by the assembled product's id) ----------
  getDefinitions(): Observable<AssemblyDefinition[]> {
    return this.http.get<ApiResponse<AssemblyDefinition[]>>(this.definitionUrl).pipe(map(unwrap));
  }

  getDefinition(outProductId: number): Observable<AssemblyDefinition> {
    return this.http.get<ApiResponse<AssemblyDefinition>>(`${this.definitionUrl}/${outProductId}`).pipe(map(unwrap));
  }

  createDefinition(d: SaveAssemblyDefinition): Observable<AssemblyDefinition> {
    return this.http.post<ApiResponse<AssemblyDefinition>>(this.definitionUrl, d).pipe(map(unwrap));
  }

  updateDefinition(outProductId: number, d: SaveAssemblyDefinition): Observable<void> {
    return this.http.put<void>(`${this.definitionUrl}/${outProductId}`, d);
  }

  deleteDefinition(outProductId: number): Observable<void> {
    return this.http.delete<void>(`${this.definitionUrl}/${outProductId}`);
  }

  /** the products that have a definition, shaped for <app-search-select> */
  readonly assembledProducts = (): Observable<LookupItem[]> =>
    this.getDefinitions().pipe(
      map(list => list
        .map(d => ({ id: d.out_product_id, name: d.out_product_name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ar'))),
    );

  // ---------- operations ----------
  getOperations(): Observable<AssemblyOperation[]> {
    return this.http.get<ApiResponse<AssemblyOperation[]>>(this.operationUrl).pipe(map(unwrap));
  }

  getOperation(id: number): Observable<AssemblyOperation> {
    return this.http.get<ApiResponse<AssemblyOperation>>(`${this.operationUrl}/${id}`).pipe(map(unwrap));
  }

  createOperation(o: SaveAssemblyOperation): Observable<AssemblyOperation> {
    return this.http.post<ApiResponse<AssemblyOperation>>(this.operationUrl, o).pipe(map(unwrap));
  }

  updateOperation(id: number, o: SaveAssemblyOperation): Observable<void> {
    return this.http.put<void>(`${this.operationUrl}/${id}`, o);
  }

  deleteOperation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.operationUrl}/${id}`);
  }
}
