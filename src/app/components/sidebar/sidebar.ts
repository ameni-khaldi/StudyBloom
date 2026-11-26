import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'sb-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `<aside class="sidebar">
    <a class="brand" [routerLink]="auth.isAdmin() ? '/admin' : '/dashboard'"><span>✿</span> StudyBloom</a>
    <nav aria-label="Navigation principale">
      @for (link of auth.isAdmin() ? adminLinks : studentLinks; track link.url) {
        <a [routerLink]="link.url" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: link.url === '/admin' }" ariaCurrentWhenActive="page"><span aria-hidden="true">{{ link.icon }}</span>{{ link.label }}</a>
      }
    </nav>
    <div class="account"><a routerLink="/profile">{{ auth.currentUser()?.name }}</a><button type="button" class="quiet" (click)="logout()">Déconnexion</button></div>
  </aside>`
})
export class SidebarComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly studentLinks = [
    { url: '/dashboard', label: 'Vue d’ensemble', icon: '⌂' },
    { url: '/subjects', label: 'Mes matières', icon: '▤' },
    { url: '/tasks', label: 'Mes tâches', icon: '✓' },
    { url: '/calendar', label: 'Calendrier', icon: '▦' },
    { url: '/statistics', label: 'Statistiques', icon: '◫' }
  ];
  protected readonly adminLinks = [
    { url: '/admin', label: 'Vue globale', icon: '⌂' },
    { url: '/admin/users', label: 'Utilisateurs', icon: '♙' },
    { url: '/admin/categories', label: 'Catégories', icon: '▤' }
  ];
  protected logout() { this.auth.logout(); void this.router.navigateByUrl('/login'); }
}
