import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';

import { routing } from './app-routing.module';

import { AuthenticationModule } from './authentication/authentication.module';
import { CalendarsModule } from './calendars/calendars.module';
import { ServerErrorComponent } from './shared/server-error/server-error.component';

@NgModule({
  declarations: [
    AppComponent,
    ServerErrorComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    routing,
    AuthenticationModule,
    CalendarsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
