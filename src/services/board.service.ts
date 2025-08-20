import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Board } from '../models/board.model';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private apiUrl = 'https://localhost:7040/api/boards';

  constructor(private http: HttpClient) {}

  getBoards(): Observable<Board[]> {
    return this.http.get<Board[]>(this.apiUrl);
  }

  getBoard(id: number): Observable<Board> {
    return this.http.get<Board>(`${this.apiUrl}/${id}`);
  }

  createBoard(board: Board): Observable<Board> {
    return this.http.post<Board>(this.apiUrl, board);
  }

  updateBoard(id: number, board: Board): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, board);
  }

  deleteBoard(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}