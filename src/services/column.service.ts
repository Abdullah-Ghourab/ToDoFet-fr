import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Column } from '../models/column.model';

@Injectable({ providedIn: 'root' })
export class ColumnService {
  private apiUrl = 'https://localhost:7040/api/columns';

  constructor(private http: HttpClient) {}

  getColumnsByBoard(boardId: number): Observable<Column[]> {
    return this.http.get<Column[]>(`${this.apiUrl}/ByBoard/${boardId}`);
  }

  createColumn(column: Column): Observable<Column> {
    return this.http.post<Column>(this.apiUrl, column);
  }

  updateColumn(id: number, column: Column): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, column);
  }

  deleteColumn(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  reorderColumn(id: number, newOrder: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/Reorder`, newOrder);
  }
}