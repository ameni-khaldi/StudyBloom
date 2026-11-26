import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard, studentGuard } from './guards/session';

const auth = () => import('./pages/auth/auth-page').then(module => module.AuthPage);
const tasks = () => import('./pages/tasks/task-editor').then(module => module.TaskEditor);
const subjects = () => import('./pages/subjects/subjects-page').then(module => module.SubjectsPage);
const admin = () => import('./pages/admin/admin-page').then(module => module.AdminPage);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', canActivate: [guestGuard], loadComponent: auth },
  { path: 'register', canActivate: [guestGuard], loadComponent: auth, data: { register: true } },
  { path: '', canActivateChild: [authGuard, studentGuard], children: [
    { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard-page').then(module => module.DashboardPage) },
    { path: 'subjects', loadComponent: subjects },
    { path: 'subjects/:id', loadComponent: subjects },
    { path: 'tasks', loadComponent: () => import('./pages/tasks/tasks-page').then(module => module.TasksPage) },
    { path: 'tasks/new', loadComponent: tasks },
    { path: 'tasks/:id/edit', loadComponent: tasks },
    { path: 'tasks/:id', loadComponent: tasks, data: { detail: true } },
    { path: 'calendar', loadComponent: () => import('./pages/calendar/calendar-page').then(module => module.CalendarPage) },
    { path: 'statistics', loadComponent: () => import('./pages/statistics/statistics-page').then(module => module.StatisticsPage), data: { statistics: true } }
  ] },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./pages/profile').then(module => module.ProfilePage) },
  { path: 'admin', canActivateChild: [authGuard, roleGuard], children: [
    { path: '', loadComponent: admin },
    { path: 'users', loadComponent: admin, data: { section: 'users' } },
    { path: 'categories', loadComponent: admin, data: { section: 'categories' } }
  ] },
  { path: '**', loadComponent: () => import('./pages/profile').then(module => module.NotFoundPage) }
];
