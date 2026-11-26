import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, switchMap, throwError } from 'rxjs';
import { Category, User } from '../../models/study';
import { CategoryService, SubjectService, TaskService, UserService } from '../../services/api';
import { PageState, StateComponent } from '../page-state';

@Component({
  imports: [RouterLink, FormsModule, ReactiveFormsModule, StateComponent],
  template: `
    <header class="page-head"><div><span class="eyebrow">ADMINISTRATION</span><h1>{{ section === 'users' ? 'Utilisateurs' : section === 'categories' ? 'Catégories' : 'Vue globale' }}</h1><p>Gestion de la plateforme StudyBloom.</p></div>
      @if (section === 'categories') { <button class="primary" (click)="open(editor)">＋ Nouvelle catégorie</button> }
    </header>
    <sb-state [busy]="busy()" [error]="error()" (retry)="load()">
      @switch (section) {
        @case ('users') {
          <div class="toolbar card"><input type="search" aria-label="Rechercher un utilisateur" placeholder="Nom ou adresse e-mail" [ngModel]="search()" (ngModelChange)="search.set($event)">
          <select aria-label="Filtrer les comptes" [ngModel]="filter()" (ngModelChange)="filter.set($event)"><option value="">Tous les comptes</option><option value="active">Actifs</option><option value="inactive">Désactivés</option><option value="admin">Administrateurs</option><option value="student">Étudiants</option></select></div>
          <div class="grid">@for (user of filtered(); track user.id) { <article class="card"><span class="tag">{{ user.active ? 'Actif' : 'Désactivé' }}</span><h2>{{ user.name }}</h2><p>{{ user.email }}</p><p>{{ user.role === 'admin' ? 'Administrateur' : 'Étudiant' }}</p>
            <button class="quiet" [disabled]="saving()" (click)="toggle(user)">{{ user.active ? 'Désactiver' : 'Activer' }}</button></article>
          } @empty { <p class="empty">Aucun utilisateur correspondant.</p> }</div>
        }
        @case ('categories') {
          <div class="grid">@for (item of categories.items(); track item.id) { <article class="card subject" [style.--accent]="item.color"><h2>{{ item.name }}</h2><p>{{ item.description || 'Aucune description.' }}</p>
            <div class="row"><button class="quiet" [disabled]="saving()" (click)="open(editor, item)">Modifier</button><button class="quiet danger" [disabled]="saving()" (click)="selected = item; confirmation.showModal()">Supprimer</button></div></article>
          } @empty { <p class="empty">Aucune catégorie.</p> }</div>
        }
        @default {
          <div class="metrics">@for (metric of metrics(); track metric.label) { <article class="card metric"><span>{{ metric.label }}</span><strong>{{ metric.value }}</strong></article> }</div>
          <div class="row"><a class="quiet" routerLink="/admin/users">Gérer les utilisateurs</a><a class="quiet" routerLink="/admin/categories">Gérer les catégories</a></div>
        }
      }
    </sb-state>
    @if (actionError()) { <p class="notice" role="alert">{{ actionError() }}</p> }
    <dialog #editor><form [formGroup]="form" (ngSubmit)="save(editor)">
      <h2>{{ editing ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}</h2>
      <label>Nom <input formControlName="name">@if (form.controls.name.touched && form.controls.name.invalid) { <small>Saisissez entre 2 et 80 caractères.</small> }</label>
      <label>Couleur <input type="color" formControlName="color"></label>
      <label>Description <textarea formControlName="description"></textarea>@if (form.controls.description.touched && form.controls.description.invalid) { <small>Limite de 500 caractères.</small> }</label>
      @if (actionError()) { <p class="notice" role="alert">{{ actionError() }}</p> }
      <div class="row"><button type="button" class="quiet" (click)="editor.close()">Annuler</button><button class="primary" [disabled]="form.invalid || saving()">Enregistrer</button></div>
    </form></dialog>
    <dialog #confirmation><h2>Supprimer la catégorie ?</h2><p>{{ selected?.name }}</p><div class="row"><button class="quiet" (click)="confirmation.close()">Annuler</button><button class="primary" [disabled]="saving()" (click)="remove(confirmation)">Supprimer</button></div></dialog>`
})
export class AdminPage extends PageState implements OnInit {
  protected readonly section: unknown = inject(ActivatedRoute).snapshot.data['section'];
  protected readonly users = inject(UserService);
  protected readonly categories = inject(CategoryService);
  private readonly subjects = inject(SubjectService);
  private readonly tasks = inject(TaskService);
  protected readonly search = signal('');
  protected readonly filter = signal('');
  protected readonly metrics = signal<{ label: string; value: number }[]>([]);
  protected readonly filtered = computed(() => this.users.items().filter(user => {
    const query = this.search().trim().toLocaleLowerCase('fr');
    const filter = this.filter();
    return (user.name + ' ' + user.email).toLocaleLowerCase('fr').includes(query) &&
      (!filter || filter === user.role || filter === (user.active ? 'active' : 'inactive'));
  }));
  protected editing?: Category;
  protected selected?: Category;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.minLength(2), Validators.maxLength(80)]],
    description: ['', Validators.maxLength(500)],
    color: ['#a9c8e8', Validators.required]
  });

  ngOnInit() { this.load(); }
  protected load() {
    if (this.section === 'users') { this.read(this.users.load()); return; }
    if (this.section === 'categories') { this.read(this.categories.load()); return; }
    this.read(forkJoin({ users: this.users.list(), categories: this.categories.list(), subjects: this.subjects.list(), tasks: this.tasks.list() }), data => {
      this.metrics.set([
        { label: 'Utilisateurs', value: data.users.length },
        { label: 'Comptes actifs', value: data.users.filter(user => user.active).length },
        { label: 'Catégories', value: data.categories.length },
        { label: 'Matières', value: data.subjects.length },
        { label: 'Tâches', value: data.tasks.length }
      ]);
    });
  }
  protected toggle(user: User) {
    this.write(this.users.list().pipe(switchMap(users => {
      if (user.active && user.role === 'admin' && users.filter(item => item.active && item.role === 'admin').length <= 1) {
        return throwError(() => new Error('Le dernier administrateur actif doit rester actif.'));
      }
      return this.users.update(user.id, { active: !user.active });
    })), 'Compte mis à jour.');
  }
  protected open(dialog: HTMLDialogElement, item?: Category) {
    this.actionError.set('');
    this.editing = item;
    this.form.reset(item ?? { color: '#a9c8e8' });
    dialog.showModal();
  }
  protected save(dialog: HTMLDialogElement) {
    if (this.saving() || this.form.invalid) return;
    const value = this.form.getRawValue();
    const request = this.editing ? this.categories.update(this.editing.id, value) : this.categories.create(value);
    this.write(request, 'Catégorie enregistrée.', () => dialog.close());
  }
  protected remove(dialog: HTMLDialogElement) {
    const item = this.selected;
    if (!item) return;
    dialog.close();
    this.write(this.subjects.list().pipe(switchMap(subjects => subjects.some(subject => subject.categoryId === item.id)
      ? throwError(() => new Error('Cette catégorie est utilisée par une matière.'))
      : this.categories.remove(item.id))), 'Catégorie supprimée.');
  }
}
