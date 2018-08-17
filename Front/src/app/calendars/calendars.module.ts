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

import { UserComponent } from './pages/user/user.component';
import { RoomComponent } from './pages/room/room.component';
import { BookingComponent } from './pages/booking/booking.component';
import { HeaderComponent } from './components/header/header.component';

import { CalendarsService } from './shared/httpService/calendars.service';
import { DataService } from './shared/dataService/data.service';

import { routing } from './calendars-routing.module';

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
    FontAwesomeModule
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
