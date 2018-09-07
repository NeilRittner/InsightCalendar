import { RouterModule, Routes } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadChildren: './authentication/authentication.module#AuthenticationModule' },
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
