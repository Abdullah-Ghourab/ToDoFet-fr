import { Component, Input, OnInit, HostListener, Output, EventEmitter } from '@angular/core';
import { Card } from '../../models/card.model';
import { Column } from '../../models/column.model';
import { CardService } from '../../services/card.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoveCardRequest } from '../../interface/move-card-request';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})
export class CardComponent implements OnInit {
  @Input() card?: Card;
  @Input() columnId?: number;
  @Input() isNew = false;
  @Input() availableColumns: Column[] = [];
  @Input() onCardDeletedCallback?: (cardId: number) => void;
  @Output() cardDeleted = new EventEmitter<number>();
  @Output() cardMoved = new EventEmitter<void>();
  
  editMode = false;
  menuOpen = false;
  showDeleteAlert = false;
  showMoveDropdown = false;
  selectedColumnId: number | null = null;
  newCard: Card = { id: 0, title: '', description: '', order: 0, columnId: 0 };

  constructor(private cardService: CardService) {}

  ngOnInit(): void {
    if (this.isNew && this.columnId) {
      this.newCard.columnId = this.columnId;
    }
  }

  createCard(): void {
    if (this.newCard.title.trim()) {
      this.cardService.createCard(this.newCard).subscribe(() => {
        this.isNew = false;
        this.newCard = { id: 0, title: '', description: '', order: 0, columnId: this.columnId || 0 };
      });
    }
  }

  updateCard(): void {
    if (this.card && this.card.title.trim()) {
      this.cardService.updateCard(this.card.id, this.card).subscribe(() => {
        this.editMode = false;
      });
    }
  }

  confirmDeleteCard(): void {
    if (this.card) {
      this.cardService.deleteCard(this.card.id).subscribe({
        next: () => {
          // Emit the event
          this.cardDeleted.emit(this.card!.id);
          // Call the callback if provided
          if (this.onCardDeletedCallback) {
            this.onCardDeletedCallback(this.card!.id);
          }
          this.showDeleteAlert = false;
        },
        error: (error) => {
          console.error('Error deleting card:', error);
          this.showDeleteAlert = false;
        }
      });
    }
  }

  deleteCard(id: number): void {
    if (confirm('Are you sure you want to delete this card?')) {
      this.cardService.deleteCard(id).subscribe({
        next: () => {
          // Emit the event
          this.cardDeleted.emit(id);
          // Call the callback if provided
          if (this.onCardDeletedCallback) {
            this.onCardDeletedCallback(id);
          }
        },
        error: (error) => {
          console.error('Error deleting card:', error);
        }
      });
    }
  }

  moveCard(): void {
    if (this.card && this.selectedColumnId && this.selectedColumnId !== this.card.columnId) {
      const request: MoveCardRequest = {
        newColumnId: this.selectedColumnId,
        newPosition: 1 // Move to top of the target column
      };
      
      this.cardService.moveCard(this.card.id, request).subscribe({
        next: () => {
          this.showMoveDropdown = false;
          this.selectedColumnId = null;
          this.cardMoved.emit();
        },
        error: (error) => {
          console.error('Error moving card:', error);
          this.showMoveDropdown = false;
        }
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const clickedInsideMenu = target.closest('.card-menu-container');
    
    if (!clickedInsideMenu) {
      this.menuOpen = false;
    }
  }
}