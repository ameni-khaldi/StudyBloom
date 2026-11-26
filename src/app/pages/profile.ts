import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  imports: [DatePipe],
  template: `<header class="page-head"><div><span class="eyebrow">MON COMPTE</span><h1>Profil</h1></div></header>
    @if (auth.currentUser(); as user) { <article class="card form-card"><h2>{{ user.name }}</h2><dl><dt>Adresse e-mail</dt><dd>{{ user.email }}</dd><dt>Rôle</dt><dd>{{ auth.isAdmin() ? 'Administrateur' : 'Étudiant' }}</dd><dt>Inscription</dt><dd>{{ user.createdAt | date:'longDate' }}</dd></dl></article> }`
})
export class ProfilePage { protected readonly auth = inject(AuthService); }

@Component({
  imports: [RouterLink],
  template: `<section class="card form-card"><span class="eyebrow">ERREUR 404</span><h1>Page introuvable</h1><p>Vérifiez l’adresse ou revenez à l’accueil.</p><a routerLink="/" class="primary">Revenir à l’accueil</a></section>`
})
export class NotFoundPage {}
