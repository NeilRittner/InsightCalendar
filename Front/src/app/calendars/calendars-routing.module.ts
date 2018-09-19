import { RouterModule, Routes } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { UserComponent } from './pages/user/user.component';
import { RoomComponent } from './pages/room/room.component';
import { BookingComponent } from './pages/booking/booking.component';
import { CreditsComponent } from './pages/credits/credits.component';

const calendarsRoutes: Routes = [
  { path: 'user', component: UserComponent },
  { path: 'booking', component: BookingComponent },
  { path: 'room/:roomName', component: RoomComponent },
  { path: 'credits', component: CreditsComponent}
];


export const routing: ModuleWithProviders = RouterModule.forChild(calendarsRoutes);
