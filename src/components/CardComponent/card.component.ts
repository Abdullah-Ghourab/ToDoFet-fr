import { Component, Input, OnInit } from '@angular/core';
import { Card } from '../../models/card.model';
import { CardService } from '../../services/card.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  
  editMode = false;
  menuOpen = false;
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

  deleteCard(id: number): void {
    if (confirm('Are you sure you want to delete this card?')) {
      this.cardService.deleteCard(id).subscribe();
    }
  }
}