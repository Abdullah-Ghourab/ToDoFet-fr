import { Component, OnInit, ViewChild } from '@angular/core';
import { BoardService } from '../../services/board.service';
import { ColumnService } from '../../services/column.service';
import { CardService } from '../../services/card.service';
import { Column } from '../../models/column.model';
import { Card } from '../../models/card.model';
import { Board } from '../../models/board.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ColumnComponent } from '../ColumnComponent/column.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, RouterModule, ColumnComponent,FormsModule],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit {
  @ViewChild(ColumnComponent) columnComponent?: ColumnComponent;
  boards: Board[] = [];
  selectedBoard: Board | null = null;
  showBoardForm = false;
  newBoard: Board = { id: 0, title: '' };
  boardsMenuOpen = false;
  actionsSidebarOpen = false;

  // Add Column modal state
  showAddColumnModal = false;
  columnTitle = '';

  // Add Card modal state
  showAddCardModal = false;
  cardTitle = '';
  cardDescription = '';
  cardColumnId: number | null = null;

  // Edit board modal state
  showEditBoardModal = false;
  editBoardTitle = '';

  constructor(private boardService: BoardService, private columnService: ColumnService, private cardService: CardService) {}

  ngOnInit(): void {
    this.loadBoards();
  }

  loadBoards(): void {
    this.boardService.getBoards().subscribe(boards => {
      this.boards = boards;
    });
  }

  selectBoard(board: Board): void {
    this.selectedBoard = { ...board };
    // Close modals/menus when switching
    this.showAddColumnModal = false;
    this.showAddCardModal = false;
    this.boardsMenuOpen = false;
  }

  createBoard(): void {
    this.boardService.createBoard(this.newBoard).subscribe(() => {
      this.loadBoards();
      this.showBoardForm = false;
      this.newBoard = { id: 0, title: '' };
    });
  }

  deleteBoard(id: number): void {
    if (confirm('Are you sure you want to delete this board?')) {
      this.boardService.deleteBoard(id).subscribe(() => {
        this.loadBoards();
        if (this.selectedBoard?.id === id) {
          this.selectedBoard = null;
        }
      });
    }
  }

  toggleBoardsMenu(): void {
    this.boardsMenuOpen = !this.boardsMenuOpen;
  }

  openAddColumnFromSidebar(): void {
    this.columnTitle = '';
    this.showAddColumnModal = true;
  }

  openAddCardFromSidebar(): void {
    this.cardTitle = '';
    this.cardDescription = '';
    // Default column selection to first available column if present
    const columns = this.columnComponent?.columns || [];
    this.cardColumnId = columns.length ? columns[0].id : null;
    this.showAddCardModal = true;
  }

  toggleActionsSidebar(): void {
    this.actionsSidebarOpen = !this.actionsSidebarOpen;
  }

  createColumnFromModal(): void {
    if (!this.selectedBoard || !this.columnTitle.trim()) {
      return;
    }
    const columns = this.columnComponent?.columns || [];
    const newColumn: Column = {
      id: 0,
      title: this.columnTitle.trim(),
      order: columns.length + 1,
      boardId: this.selectedBoard.id
    };
    this.columnService.createColumn(newColumn).subscribe(() => {
      this.showAddColumnModal = false;
      this.columnTitle = '';
      this.columnComponent?.loadColumns();
    });
  }

  createCardFromModal(): void {
    if (!this.cardTitle.trim() || !this.cardColumnId) {
      return;
    }
    const targetColumn = (this.columnComponent?.columns || []).find(c => c.id === this.cardColumnId);
    const newCard: Card = {
      id: 0,
      title: this.cardTitle.trim(),
      description: this.cardDescription || '',
      order: (targetColumn?.cards?.length || 0) + 1,
      columnId: this.cardColumnId
    };
    this.cardService.createCard(newCard).subscribe(() => {
      this.showAddCardModal = false;
      this.cardTitle = '';
      this.cardDescription = '';
      this.cardColumnId = null;
      this.columnComponent?.loadColumns();
    });
  }

  openEditBoardModal(board: Board): void {
    this.selectedBoard = board;
    this.editBoardTitle = board.title;
    this.showEditBoardModal = true;
  }

  saveBoardTitle(): void {
    if (!this.selectedBoard || !this.editBoardTitle.trim()) {
      return;
    }
    const updated: Board = { ...this.selectedBoard, title: this.editBoardTitle.trim() };
    this.boardService.updateBoard(updated.id, updated).subscribe(() => {
      // Update in list and selected reference
      const idx = this.boards.findIndex(b => b.id === updated.id);
      if (idx >= 0) this.boards[idx].title = updated.title;
      if (this.selectedBoard?.id === updated.id) this.selectedBoard.title = updated.title;
      this.showEditBoardModal = false;
    });
  }

  goToWelcome(): void {
    this.selectedBoard = null;
    this.boardsMenuOpen = false;
    this.actionsSidebarOpen = false;
  }
}