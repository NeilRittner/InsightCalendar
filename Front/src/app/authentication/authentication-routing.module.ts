import { RouterModule, Routes } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';
import { AuthorizationComponent } from './pages/authorization/authorization.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';

const authenticationRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'authorization', component: AuthorizationComponent },
];

export const routing: ModuleWithProviders = RouterModule.forChild(authenticationRoutes);
