import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { PageState } from '../page-state';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  template: `<div class="auth-layout">
    <section class="auth-art"><a routerLink="/" class="brand"><span>✿</span> StudyBloom</a>
      <div><div class="auth-flower" aria-hidden="true">✿</div><h1>Fais fleurir<br>ta réussite.</h1><p>Un espace pour organiser tes études et voir tes progrès grandir.</p></div>
    </section>
    <section class="auth-form"><span class="eyebrow">STUDYBLOOM</span><h2>{{ register ? 'Créer un compte' : 'Bon retour !' }}</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        @if (register) { <label>Prénom et nom <input formControlName="name" autocomplete="name">
          @if (form.controls.name.touched && form.controls.name.invalid) { <small>Saisissez de 2 à 80 caractères.</small> }</label> }
        <label>Adresse e-mail <input formControlName="email" type="email" autocomplete="email">
          @if (form.controls.email.touched && form.controls.email.invalid) { <small>Saisissez une adresse e-mail valide.</small> }</label>
        <label>Mot de passe <input formControlName="password" type="password" [attr.autocomplete]="register ? 'new-password' : 'current-password'">
          @if (form.controls.password.touched && form.controls.password.invalid) { <small>Saisissez entre 8 et 80 caractères.</small> }</label>
        @if (actionError()) { <p role="alert" class="notice">{{ actionError() }}</p> }
        <button class="primary" [disabled]="form.invalid || saving()">{{ saving() ? 'Veuillez patienter…' : (register ? 'Créer mon compte' : 'Me connecter') }}</button>
      </form>
      @if (register) { <p>Déjà un compte ? <a routerLink="/login">Se connecter</a></p> }
      @else { <p>Pas encore de compte ? <a routerLink="/register">S’inscrire</a></p>
        <details><summary>Comptes de démonstration</summary>
          <button class="quiet" (click)="demo('lina')">Étudiant</button> <button class="quiet" (click)="demo('admin')">Administrateur</button>
        </details>
      }
    </section>
  </div>`
})
export class AuthPage extends PageState {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly register = inject(ActivatedRoute).snapshot.data['register'] === true;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', this.register ? [Validators.required, Validators.pattern(/\S/), Validators.minLength(2), Validators.maxLength(80)] : []],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(80)]]
  });
  protected demo(user: string) { this.form.patchValue({ email: user + '@studybloom.test', password: 'Bloom2027!' }); }
  protected submit() {
    if (this.form.invalid || this.saving()) return;
    const { name, email, password } = this.form.getRawValue();
    if (this.register) this.write(this.auth.register(name, email, password), 'Compte créé.', () => void this.router.navigateByUrl('/login'));
    else this.write(this.auth.login(email, password), 'Connexion réussie.', user => void this.router.navigateByUrl(user.role === 'admin' ? '/admin' : '/dashboard'));
  }
}
