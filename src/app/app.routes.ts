import { Routes } from '@angular/router';
import { ReservationComponent } from './pages/reservation/reservation.component';

export const routes: Routes = [
  { path: 'reserve', component: ReservationComponent },
  { path: '', redirectTo: '/reserve', pathMatch: 'full' }
];
