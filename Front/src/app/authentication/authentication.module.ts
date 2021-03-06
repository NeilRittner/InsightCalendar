import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthorizationComponent } from './pages/authorization/authorization.component';
import { AuthenticationService } from './shared/authentication.service';
import { routing } from './authentication-routing.module';
import { SocialLoginModule, AuthServiceConfig } from 'angular-6-social-login';
import { getAuthServiceConfigs } from './socialloginConfig';

@NgModule({
  imports: [
    CommonModule,
    routing,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    SocialLoginModule,
    ToastrModule.forRoot()
  ],
  declarations: [
    LoginComponent,
    RegisterComponent,
    AuthorizationComponent
  ],
  providers: [
    AuthenticationService,
    {
      provide: AuthServiceConfig,
      useFactory: getAuthServiceConfigs
    }
  ],
  exports: []
})
export class AuthenticationModule { }
