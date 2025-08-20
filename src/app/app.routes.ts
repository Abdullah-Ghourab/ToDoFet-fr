import { Routes } from '@angular/router';
import { BoardComponent } from '../components/BoardComponent/board.component';

export const routes: Routes = [
  { path: '', redirectTo: '/boards', pathMatch: 'full' },
  { path: 'boards', component: BoardComponent },
];