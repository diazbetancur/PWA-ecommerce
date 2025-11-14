import { Route } from '@angular/router';
import { AuthGuard } from '@pwa/core';
import {
  ForgotPasswordComponent,
  LoginComponent,
  ProfileComponent,
  RegisterComponent,
} from './components';

export const featuresAccountRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  { path: '', redirectTo: 'profile', pathMatch: 'full' },
];
