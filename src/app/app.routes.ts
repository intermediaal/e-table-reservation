
import { Routes } from '@angular/router';
import { ReservationComponent } from './pages/reservation/reservation.component';
import { ReservationConfirmationComponent } from './pages/reservation-confirmation/reservation-confirmation.component';

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
    path: '',
    redirectTo: '/reservation/intermedia',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/reservation/intermedia'
  }
];
