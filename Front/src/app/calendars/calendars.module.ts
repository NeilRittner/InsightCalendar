import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { UserComponent } from './pages/user/user.component';
import { RoomComponent } from './pages/room/room.component';
import { BookingComponent } from './pages/booking/booking.component';

import { CalendarsService } from './shared/calendars.service';

import { routing } from './calendars-routing.module';
import { HeaderComponent } from './components/header/header.component';

@NgModule({
  imports: [
    CommonModule,
    routing,
    HttpClientModule,
    FormsModule
  ],
  declarations: [
    UserComponent,
    RoomComponent,
    BookingComponent,
    HeaderComponent
  ],
  providers: [
    CalendarsService
  ],
  exports: []
})
export class CalendarsModule { }
