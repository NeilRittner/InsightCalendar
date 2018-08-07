import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { SocialLoginModule, AuthServiceConfig } from 'angular-6-social-login';
import { getAuthServiceConfigs } from './socialloginConfig';
import { AppRoutingModule, RoutingComponents } from './/app-routing.module';
import { AuthorizeComponent } from './authorize/authorize.component';

@NgModule({
  declarations: [
    AppComponent,
    RoutingComponents,
    AuthorizeComponent
  ],
  imports: [
    BrowserModule,
    SocialLoginModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [
    {
      provide: AuthServiceConfig,
      useFactory: getAuthServiceConfigs
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
