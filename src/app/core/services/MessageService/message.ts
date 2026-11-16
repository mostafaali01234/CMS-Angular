import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { Paged } from '../../../shared/models/paged.model';
import { Contact, Conversation, UserMessage } from '../../../shared/models/notification.model';
import { toParams } from '../../../shared/utils/params';

/** accepts both the { succeeded, data } envelope and a bare body */
export function body<T>(res: unknown): T {
  const r = res as Partial<ApiResponse<T>> | null;
  if (r && typeof r === 'object' && 'succeeded' in r) {
    if (!r.succeeded) throw r;
    return r.data as T;
  }
  return res as T;
}

/** REST side of the direct messages. The live side (new message pushed to you) is in NotificationService. */
@Injectable({ providedIn: 'root' })
export class MessageService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/UserMessage`;

  contacts(): Observable<Contact[]> {
    return this.http.get<unknown>(`${this.baseUrl}/contacts`).pipe(map(r => body<Contact[]>(r)));
  }

  conversations(): Observable<Conversation[]> {
    return this.http.get<unknown>(`${this.baseUrl}/conversations`).pipe(map(r => body<Conversation[]>(r)));
  }

  /** one chat, newest first (the next page = older messages) */
  thread(withUserId: string, page: number, pageSize: number, orderId = 0): Observable<Paged<UserMessage>> {
    return this.http
      .get<unknown>(this.baseUrl, { params: toParams({ withUserId, orderId, page, pageSize }) })
      .pipe(map(r => body<Paged<UserMessage>>(r)));
  }

  send(recipientUserId: string, text: string, orderId?: number | null): Observable<UserMessage> {
    return this.http
      .post<unknown>(this.baseUrl, { recipient_user_id: recipientUserId, body: text, order_id: orderId ?? null })
      .pipe(map(r => body<UserMessage>(r)));
  }

  /** I opened this chat: marks their messages (and their bell items) as read */
  markThreadRead(withUserId: string): Observable<unknown> {
    return this.http.post<unknown>(`${this.baseUrl}/read`, {}, { params: toParams({ withUserId }) });
  }
}
