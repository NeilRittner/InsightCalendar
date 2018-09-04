import { environment } from './../../environments/environment';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { MatFormFieldModule, MatInputModule, MatAutocompleteModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatGridListModule } from '@angular/material/grid-list';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';

import { UserComponent } from './pages/user/user.component';
import { RoomComponent } from './pages/room/room.component';
import { BookingComponent } from './pages/booking/booking.component';
import { HeaderComponent } from './components/header/header.component';
import { CalendarComponent } from './components/calendar/calendar.component';

import { CalendarsService } from './shared/httpService/calendars.service';
import { DataService } from './shared/dataService/data.service';
import { SocketsService } from './shared/socketsService/sockets.service';

import { routing } from './calendars-routing.module';

import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

// configuration du socket avec le serveur
const socketsConfig: SocketIoConfig = {
  url: environment.serveur_url,
  options: {}
};

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    routing,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BsDatepickerModule.forRoot(),
    TimepickerModule.forRoot(),
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    FontAwesomeModule,
    MatGridListModule,
    ProgressbarModule.forRoot(),
    SocketIoModule.forRoot(socketsConfig)
  ],
  declarations: [
    UserComponent,
    RoomComponent,
    BookingComponent,
    HeaderComponent,
    CalendarComponent
  ],
  providers: [
    CalendarsService,
    DataService,
    SocketsService
  ],
  exports: []
})
export class CalendarsModule { }
