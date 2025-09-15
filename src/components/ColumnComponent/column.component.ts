import { Component, Input, OnInit, OnChanges, SimpleChanges, HostListener, ChangeDetectorRef } from '@angular/core';
import { Column } from '../../models/column.model';
import { Card } from '../../models/card.model';
import { ColumnService } from '../../services/column.service';
import { CardService } from '../../services/card.service';
import { CommonModule } from '@angular/common';
// Drag-and-drop removed
import { CardComponent } from '../CardComponent/card.component';
import { Board } from '../../models/board.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CommonModule, CardComponent, FormsModule],
  templateUrl: './column.component.html',
  styleUrls: ['./column.component.css']
})
export class ColumnComponent implements OnInit, OnChanges {
  @Input() board!: Board;
  columns: Column[] = [];
  showColumnForm = false;
  newColumn: Column = { id: 0, title: '', order: 0, boardId: 0 };
  // drag-and-drop removed: dropListIds no longer used
  showAddCardForm = false;
  boardNewCard: Card = { 
    id: 0, 
    title: '', 
    description: '', 
    createdOn: new Date().toISOString(),
    priority: 1, // Default to Medium priority
    order: 0, 
    columnId: 0 
  };
  columnMenuOpen: { [columnId: number]: boolean } = {};
  editingColumnId: number | null = null;
  editColumnTitle: string = '';
  showDeleteAlert = false;
  columnToDelete: Column | null = null;
  // drag-and-drop removed: suppressAutoReload and drop list refs

  constructor(
    private columnService: ColumnService,
    private cardService: CardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadColumns();
  }

  // drag-and-drop removed: allowDrop predicate

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
        // drag-and-drop removed: no connected list ids needed
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

  showDeleteColumnAlert(column: Column): void {
    this.columnToDelete = column;
    this.showDeleteAlert = true;
  }

  confirmDeleteColumn(): void {
    if (this.columnToDelete) {
      this.columnService.deleteColumn(this.columnToDelete.id).subscribe(() => {
        this.loadColumns();
        this.showDeleteAlert = false;
        this.columnToDelete = null;
      });
    }
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

  onCardMoved(): void {
    // Simply reload all columns to reflect the changes
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

  // drag-and-drop removed: updateCardOrders no longer used

  // drag-and-drop removed: onDrop no longer used

  trackByColumnId(_index: number, column: Column): number {
    return column?.id ?? -1;
  }

  trackByCardId(_index: number, card: Card): any {
    // Use a composite key so moving between columns changes identity and forces re-render
    return card ? `${card.id}-${card.columnId}` : -1;
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
    
    // Ensure priority is set (default to 1 - Medium if not set)
    const newCard: Card = {
      ...this.boardNewCard,
      priority: this.boardNewCard.priority ?? 1, // Ensure priority is set
      createdOn: new Date().toISOString(),
      order: 0 // Will be set by the server
    };
    
    this.cardService.createCard(newCard).subscribe((created) => {
      const targetColumn = this.columns.find(c => c.id === created.columnId);
      if (targetColumn) {
        if (!targetColumn.cards) {
          targetColumn.cards = [];
        }
        targetColumn.cards.push(created);
      }
      
      // Reset the form with default values
      this.boardNewCard = { 
        id: 0, 
        title: '', 
        description: '', 
        createdOn: new Date().toISOString(),
        priority: 1, // Reset to default Medium priority
        order: 0, 
        columnId: this.boardNewCard.columnId // Keep the same column selected
      };
      
      this.showAddCardForm = false;
      this.loadColumns(); // Refresh to ensure proper ordering
    });
  }
}