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

  updateCard(id: number, card: Card): Observable<Card> {
    // Ensure the card ID in the URL matches the card object's ID
    if (id !== card.id) {
      throw new Error(`Card ID mismatch: URL ID (${id}) does not match card ID (${card.id})`);
    }
    
    // Log the request payload for debugging
    console.log('Sending update request for card:', JSON.stringify(card, null, 2));
    
    return this.http.put<Card>(`${this.apiUrl}/${id}`, card, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  deleteCard(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  moveCard(id: number, request: MoveCardRequest): Observable<Card> {
    return this.http.patch<Card>(`${this.apiUrl}/${id}/Move`, request);
  }
}