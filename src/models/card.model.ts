export enum Priority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3
}

export interface Card {
  id: number;
  title: string;
  description: string;
  createdOn: Date | string; // Always stored as ISO string for backend compatibility
  priority: number;
  order: number;
  columnId: number;
  isEditing?: boolean;
}