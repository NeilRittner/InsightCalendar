import { ServerErrorComponent } from './shared/server-error/server-error.component';
import { RouterModule, Routes } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadChildren: './authentication/authentication.module#AuthenticationModule' },
  { path: 'server-error/:message', component: ServerErrorComponent}
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
