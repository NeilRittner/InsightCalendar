import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';

import { UserComponent } from './pages/user/user.component';
import { RoomComponent } from './pages/room/room.component';
import { BookingComponent } from './pages/booking/booking.component';
import { HeaderComponent } from './components/header/header.component';

import { CalendarsService } from './shared/httpService/calendars.service';
import { DataService } from './shared/dataService/data.service';

import { routing } from './calendars-routing.module';

@NgModule({
  imports: [
    CommonModule,
    routing,
    HttpClientModule,
    FormsModule,
    BsDatepickerModule.forRoot(),
    TimepickerModule.forRoot()
  ],
  declarations: [
    UserComponent,
    RoomComponent,
    BookingComponent,
    HeaderComponent
  ],
  providers: [
    CalendarsService,
    DataService
  ],
  exports: []
})
export class CalendarsModule { }
