import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { MainLayoutComponent } from './layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    component: MainLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'members',
        loadComponent: () =>
          import('./features/members/member-list.component').then((m) => m.MemberListComponent),
      },
      {
        path: 'members/new',
        loadComponent: () =>
          import('./features/members/member-form.component').then((m) => m.MemberFormComponent),
      },
      {
        path: 'members/:id/edit',
        loadComponent: () =>
          import('./features/members/member-form.component').then((m) => m.MemberFormComponent),
      },
      {
        path: 'members/:id',
        loadComponent: () =>
          import('./features/members/member-detail.component').then((m) => m.MemberDetailComponent),
      },
      {
        path: 'attendance',
        loadComponent: () =>
          import('./features/attendance/attendance-list.component').then(
            (m) => m.AttendanceListComponent
          ),
      },
      {
        path: 'attendance/check-in',
        loadComponent: () =>
          import('./features/attendance/check-in-kiosk.component').then(
            (m) => m.CheckInKioskComponent
          ),
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./features/billing/billing.component').then((m) => m.BillingComponent),
      },
      {
        path: 'billing/payment',
        loadComponent: () =>
          import('./features/billing/payment-form.component').then((m) => m.PaymentFormComponent),
      },
      {
        path: 'subscriptions/sell',
        loadComponent: () =>
          import('./features/subscriptions/sell-subscription.component').then(
            (m) => m.SellSubscriptionComponent
          ),
      },
      {
        path: 'plans',
        loadComponent: () =>
          import('./features/plans/plans-list.component').then((m) => m.PlansListComponent),
      },
      {
        path: 'classes',
        loadComponent: () =>
          import('./features/classes/classes-list.component').then((m) => m.ClassesListComponent),
      },
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: ['BRANCH_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'admin/branches',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/admin/branches.component').then((m) => m.BranchesComponent),
      },
      {
        path: 'admin/staff',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'BRANCH_MANAGER'] },
        loadComponent: () =>
          import('./features/admin/staff.component').then((m) => m.StaffComponent),
      },
      {
        path: 'admin/staff/new',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'BRANCH_MANAGER'] },
        loadComponent: () =>
          import('./features/admin/staff-form.component').then((m) => m.StaffFormComponent),
      },
      {
        path: 'admin/staff/:id/edit',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'BRANCH_MANAGER'] },
        loadComponent: () =>
          import('./features/admin/staff-form.component').then((m) => m.StaffFormComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
