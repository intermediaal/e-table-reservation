import { Routes } from '@angular/router';
import { ReservationComponent } from './pages/reservation/reservation.component'; // Adjust path if needed

export const routes: Routes = [

  {
    path: 'reservation/:businessSlug',
    component: ReservationComponent
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
