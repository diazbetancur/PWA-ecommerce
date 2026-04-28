import { Route } from '@angular/router';
import { AuthGuard } from '@pwa/core';
import {
  ActivateAccountComponent,
  ForgotPasswordComponent,
  LoginComponent,
  ProfileComponent,
  RegisterComponent,
  ResetPasswordComponent,
} from './components';

export const featuresAccountRoutes: Route[] = [
  { path: 'activate-account', component: ActivateAccountComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  { path: '', redirectTo: 'profile', pathMatch: 'full' },
];
