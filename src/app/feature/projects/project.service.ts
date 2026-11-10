// project.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { Project, ProjectReviewData, ReviewSummary } from './project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/project`;
  private reviewUrl = `${environment.apiUrl}/ProjectReview`;

  getAll(): Observable<Project[]> {
    return this.http.get<ApiResponse<Project[]>>(this.baseUrl).pipe(map(unwrap));
  }
  getById(id: number): Observable<Project> {
    return this.http.get<ApiResponse<Project>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }
  create(p: Project): Observable<Project> {
    return this.http.post<ApiResponse<Project>>(this.baseUrl, p).pipe(map(unwrap));
  }
  update(id: number, p: Project): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, p);
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private dates(from: string, to: string) {
    let p = new HttpParams();
    if (from) p = p.set('dateFrom', from);
    if (to) p = p.set('dateTo', to);
    return p;
  }
  summaries(from: string, to: string): Observable<ReviewSummary[]> {
    return this.http.get<ApiResponse<ReviewSummary[]>>(this.reviewUrl, { params: this.dates(from, to) }).pipe(map(unwrap));
  }
  review(id: number, from: string, to: string): Observable<ProjectReviewData> {
    return this.http.get<ApiResponse<ProjectReviewData>>(`${this.reviewUrl}/${id}`, { params: this.dates(from, to) }).pipe(map(unwrap));
  }
  exportReview(id: number, from: string, to: string): Observable<Blob> {
    return this.http.get(`${this.reviewUrl}/${id}/export`, { params: this.dates(from, to), responseType: 'blob' });
  }
}