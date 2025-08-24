import { Component, Input, OnInit, OnChanges, SimpleChanges, HostListener, ChangeDetectorRef } from '@angular/core';
import { Column } from '../../models/column.model';
import { Card } from '../../models/card.model';
import { ColumnService } from '../../services/column.service';
import { CardService } from '../../services/card.service';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CardComponent } from '../CardComponent/card.component';
import { Board } from '../../models/board.model';
import { MoveCardRequest } from '../../interface/move-card-request';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag, CardComponent,FormsModule],
  templateUrl: './column.component.html',
  styleUrls: ['./column.component.css']
})
export class ColumnComponent implements OnInit, OnChanges {
  @Input() board!: Board;
  columns: Column[] = [];
  showColumnForm = false;
  newColumn: Column = { id: 0, title: '', order: 0, boardId: 0 };
  dropListIds: string[] = [];
  showAddCardForm = false;
  boardNewCard: Card = { id: 0, title: '', description: '', order: 0, columnId: 0 };
  columnMenuOpen: { [columnId: number]: boolean } = {};
  editingColumnId: number | null = null;
  editColumnTitle: string = '';

  constructor(
    private columnService: ColumnService,
    private cardService: CardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadColumns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['board'] && this.board?.id) {
      this.loadColumns();
    }
  }

  loadColumns(): void {
    if (this.board?.id) {
      this.columnService.getColumnsByBoard(this.board.id).subscribe(columns => {
        // Ensure stable ordering of columns and cards after any backend-side moves
        this.columns = (columns || [])
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map(col => ({
            ...col,
            cards: (col.cards || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          }));
        this.dropListIds = (this.columns || []).map(c => c.id.toString());
      });
    }
  }

  createColumn(): void {
    this.newColumn.boardId = this.board.id;
    this.newColumn.order = this.columns.length + 1;
    
    this.columnService.createColumn(this.newColumn).subscribe(() => {
      this.loadColumns();
      this.showColumnForm = false;
      this.newColumn = { id: 0, title: '', order: 0, boardId: 0 };
    });
  }

  deleteColumn(id: number): void {
    if (confirm('Delete this column? All its cards will be moved to the first column on the board.')) {
      this.columnService.deleteColumn(id).subscribe(() => {
        this.loadColumns();
      });
    }
  }

  startEditColumn(column: Column): void {
    this.editingColumnId = column.id;
    this.editColumnTitle = column.title;
    this.columnMenuOpen[column.id] = false;
  }

  saveColumnEdit(): void {
    if (this.editingColumnId && this.editColumnTitle.trim()) {
      const column = this.columns.find(c => c.id === this.editingColumnId);
      if (column) {
        const updatedColumn = { ...column, title: this.editColumnTitle.trim() };
        this.columnService.updateColumn(this.editingColumnId, updatedColumn).subscribe(() => {
          this.loadColumns();
          this.cancelColumnEdit();
        });
      }
    }
  }

  cancelColumnEdit(): void {
    this.editingColumnId = null;
    this.editColumnTitle = '';
  }

  onCardDeleted(cardId: number): void {
    // Simply reload all columns to ensure UI is updated
    this.loadColumns();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const clickedInsideMenu = target.closest('.column-menu-container');
    
    if (!clickedInsideMenu) {
      // Close all column menus
      this.columnMenuOpen = {};
    }
  }

  onDrop(event: CdkDragDrop<Card[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    const card = event.container.data[event.currentIndex];
    const newColumnId = Number(event.container.id);
    if (card) {
      card.columnId = newColumnId;
    }
    const request: MoveCardRequest = {
      newColumnId: newColumnId,
      newPosition: event.currentIndex + 1
    };

    this.cardService.moveCard(card.id, request).subscribe();
  }

  trackByColumnId(index: number, column: Column): number {
    return column.id;
  }

  trackByCardId(index: number, card: Card): number {
    return card.id;
  }

  openAddCardForm(): void {
    if (this.columns?.length) {
      this.boardNewCard.columnId = this.columns[0].id;
    }
    this.showAddCardForm = true;
  }

  createBoardLevelCard(): void {
    if (!this.boardNewCard.title.trim() || !this.boardNewCard.columnId) {
      return;
    }
    this.cardService.createCard(this.boardNewCard).subscribe((created) => {
      const targetColumn = this.columns.find(c => c.id === created.columnId);
      if (targetColumn) {
        if (!targetColumn.cards) {
          targetColumn.cards = [];
        }
        targetColumn.cards.push(created);
      }
      this.boardNewCard = { id: 0, title: '', description: '', order: 0, columnId: 0 };
      this.showAddCardForm = false;
    });
  }
}