import { Routes } from '@angular/router';
import { ReservationComponent } from './pages/reservation/reservation.component';
import { ReservationConfirmationComponent } from './pages/reservation-confirmation/reservation-confirmation.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
  {
    path: 'reservation/:businessSlug',
    component: ReservationComponent
  },
  {
    path: 'view-reservation/:token',
    component: ReservationConfirmationComponent
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];
