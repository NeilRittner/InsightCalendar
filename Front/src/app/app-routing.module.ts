import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HomeComponent } from './home/home.component';
import { AuthorizeComponent } from './authorize/authorize.component';
import { ReservationsComponent } from './reservations/reservations.component';


const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent } ,
  { path: 'authorize', component: AuthorizeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'reservations', component: ReservationsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
export const RoutingComponents = [
  LoginComponent,
  RegisterComponent,
  AuthorizeComponent,
  HomeComponent,
  ReservationsComponent
];
