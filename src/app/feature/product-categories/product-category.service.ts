// product-category.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { LookupService } from '../../shared/services/lookup.service';
import { ProductCategory } from './product-category.model';

@Injectable({ providedIn: 'root' })
export class ProductCategoryService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/productCategory`;
  private lookup = inject(LookupService);


  getAll(): Observable<ProductCategory[]> {
    return this.http.get<ApiResponse<ProductCategory[]>>(this.baseUrl).pipe(map(unwrap));
  }

  getById(id: number): Observable<ProductCategory> {
    return this.http.get<ApiResponse<ProductCategory>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  create(category: ProductCategory): Observable<ProductCategory> {
    return this.http
      .post<ApiResponse<ProductCategory>>(this.baseUrl, category)
      .pipe(map(unwrap), tap(() => this.lookup.clear('productCategories')));
  }

  update(id: number, category: ProductCategory): Observable<void> {
    return this.http
      .put<void>(`${this.baseUrl}/${id}`, category)
      .pipe(tap(() => this.lookup.clear('productCategories')));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(tap(() => this.lookup.clear('productCategories')));
  }
}