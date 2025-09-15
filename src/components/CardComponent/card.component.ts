import { Component, Input, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { Card, Priority } from '../../models/card.model';
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
  @Output() cardMoved = new EventEmitter<Card>();
  
  editMode = false;
  menuOpen = false;
  showDeleteAlert = false;
  showMoveDropdown = false;
  selectedColumnId: number | null = null;
  showDetailView = false;
  newCard: Card = { 
    id: 0, 
    title: '', 
    description: '', 
    createdOn: new Date().toISOString(),
    priority: 1, // Default to Medium priority
    order: 0, 
    columnId: 0 
  };

  constructor(private cardService: CardService) {}

  ngOnInit(): void {
    if (this.isNew && this.columnId) {
      this.newCard.columnId = this.columnId;
    }
  }

  // Format the date in a way the backend expects (YYYY-MM-DDTHH:mm:ss.fffffff)
  private formatDateForBackend(date: Date | string): string {
    let d: Date;
    if (typeof date === 'string') {
      // If it's already in ISO format, return as is
      if (date.includes('T') && (date.endsWith('Z') || date.includes('+'))) {
        return date;
      }
      d = new Date(date);
    } else {
      d = date;
    }
    
    // Format: YYYY-MM-DDTHH:mm:ss.fffffff (with milliseconds and timezone)
    const pad = (num: number, length: number = 2) => num.toString().padStart(length, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    const milliseconds = pad(d.getMilliseconds(), 7);
    
    // Get timezone offset in format ±HH:mm
    const tzOffset = -d.getTimezoneOffset();
    const tzSign = tzOffset >= 0 ? '+' : '-';
    const tzHours = pad(Math.floor(Math.abs(tzOffset) / 60));
    const tzMinutes = pad(Math.abs(tzOffset) % 60);
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${tzSign}${tzHours}:${tzMinutes}`;
  }

  createCard(): void {
    if (this.newCard.title.trim()) {
      const cardToCreate = {
        ...this.newCard,
        createdOn: new Date().toISOString(),
        priority: this.newCard.priority ?? 1,
        columnId: this.columnId || this.newCard.columnId
      };
      
      this.cardService.createCard(cardToCreate).subscribe({
        next: () => {
          this.isNew = false;
          this.newCard = { 
            id: 0, 
            title: '', 
            description: '', 
            createdOn: new Date().toISOString(),
            priority: 1, // Reset to default Medium priority
            order: 0, 
            columnId: this.columnId || 0 
          };
        },
        error: (error) => {
          console.error('Error creating card:', error);
          alert('Failed to create card. Please check the console for details.');
        }
      });
    }
  }

  updateCard(): void {
    if (this.card && this.card.title.trim()) {
      this.card.isEditing = false;
      // Ensure priority is a valid number (0-3)
      const getPriorityValue = (p: any): number => {
        if (p === undefined) return 1; // Default to Medium
        const num = typeof p === 'string' ? parseInt(p, 10) : Number(p);
        return isNaN(num) ? 1 : Math.max(0, Math.min(3, num));
      };
      
      const updatedCard = {
        id: this.card.id,
        title: this.card.title.trim(),
        description: this.card.description || '',
        createdOn: this.formatDateForBackend(this.card.createdOn || new Date()),
        priority: getPriorityValue(this.card.priority),
        order: this.card.order || 0,
        columnId: this.columnId || this.card.columnId || 0
      };
      
      console.log('Sending update with payload:', JSON.stringify(updatedCard, null, 2));
      
      this.cardService.updateCard(updatedCard.id, updatedCard).subscribe({
        next: (updatedCardFromServer) => {
          console.log('Update successful:', updatedCardFromServer);
          // Update the local card reference with the values from the server
          if (this.card) {
            // Create a new object reference to trigger change detection
            this.card = { ...this.card, ...updatedCardFromServer };
            // Emit an event to notify parent components about the update
            this.cardMoved.emit();
          }
          this.editMode = false;
        },
        error: (error) => {
          console.error('Error updating card. Status:', error.status);
          console.error('Error details:', error.error);
          console.error('Full error:', error);
          
          // Show user-friendly error message
          let errorMessage = 'Failed to update card. ';
          if (error.error?.errors) {
            // Handle validation errors
            const errorMessages = [];
            for (const key in error.error.errors) {
              errorMessages.push(...error.error.errors[key]);
            }
            errorMessage += errorMessages.join(' ');
          } else if (error.error?.title) {
            errorMessage += error.error.title;
          }
          
          alert(errorMessage);
        }
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
  onClickOutside(event: MouseEvent) {
    if (!this.menuOpen) return;
    
    const target = event.target as HTMLElement;
    const clickedInsideMenu = target.closest('.relative.inline-block.text-left');
    
    if (!clickedInsideMenu) {
      this.menuOpen = false;
    }
  }

  toggleMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  cancelEdit(): void {
    this.editMode = false;
    if (this.card) {
      this.card.isEditing = false;
    }
    this.menuOpen = false;
  }

  openDetailView(): void {
    this.showDetailView = true;
  }

  closeDetailView(): void {
    this.showDetailView = false;
  }

  getPriorityText(priority: number | undefined): string {
    if (priority === undefined) return 'Not set';
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    return priorities[priority] || 'Not set';
  }

  editCard(): void {
    this.editMode = true;
    if (this.card) {
      this.card.isEditing = true;
    }
    this.menuOpen = false;
  }

  initiateMove(): void {
    if (this.card) {
      this.showMoveDropdown = true;
      this.menuOpen = false;
    }
  }

  initiateDelete(): void {
    this.showDeleteAlert = true;
    this.menuOpen = false;
  }
}