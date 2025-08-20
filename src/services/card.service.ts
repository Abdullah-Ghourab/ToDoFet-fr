import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Card } from '../models/card.model';
import { MoveCardRequest } from '../interface/move-card-request';

@Injectable({ providedIn: 'root' })
export class CardService {
  private apiUrl = 'https://localhost:7040/api/cards';

  constructor(private http: HttpClient) {}

  getCardsByColumn(columnId: number): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.apiUrl}/ByColumn/${columnId}`);
  }

  createCard(card: Card): Observable<Card> {
    return this.http.post<Card>(this.apiUrl, card);
  }

  updateCard(id: number, card: Card): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, card);
  }

  deleteCard(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  moveCard(id: number, request: MoveCardRequest): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/Move`, request);
  }
}