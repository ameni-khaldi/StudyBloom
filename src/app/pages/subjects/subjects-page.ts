import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { concatMap, from, switchMap, toArray } from 'rxjs';
import { Subject } from '../../models/study';
import { CategoryService } from '../../services/api';
import { AuthService } from '../../services/auth';
import { StudyService } from '../../services/study';
import { PageState, StateComponent } from '../page-state';

@Component({
  imports: [FormsModule, ReactiveFormsModule, RouterLink, StateComponent],
  template: `
    @if (id) { <a class="back" routerLink="/subjects">← Mes matières</a> }
    <header class="page-head"><div><span class="eyebrow">MON SEMESTRE</span><h1>{{ selected()?.name ?? 'Mes matières' }}</h1><p>Organise tes cours par catégorie.</p></div>@if (!id) { <button class="primary" (click)="open(editor)">＋ Nouvelle matière</button> }</header>
    <sb-state [busy]="busy()" [error]="error()" (retry)="load()">
      @if (selected(); as subject) {
        <article class="card subject" [style.--accent]="subject.color"><p>{{ subject.description || 'Aucune description.' }}</p>
          <div class="row"><button class="quiet" (click)="open(editor, subject)">Modifier</button><button class="quiet danger" (click)="confirmation.showModal()">Supprimer</button></div>
          <h2>Tâches associées</h2>
          @for (task of study.tasks.items(); track task.id) { @if (task.subjectId === subject.id) { <p><a [routerLink]="['/tasks', task.id]">{{ task.title }}</a></p> } }
          @if (!hasTasks(subject.id)) { <p>Aucune tâche pour cette matière.</p> }
        </article>
      } @else {
        <div class="toolbar card"><input type="search" aria-label="Rechercher une matière" placeholder="Rechercher une matière…" [ngModel]="search()" (ngModelChange)="search.set($event)">
          <select aria-label="Catégorie" [ngModel]="category()" (ngModelChange)="category.set($event)"><option value="">Toutes les catégories</option>
            @for (item of categories.items(); track item.id) { <option [value]="item.id">{{ item.name }}</option> }</select></div>
        <div class="grid">
          @for (subject of filtered(); track subject.id) { <article class="card subject" [style.--accent]="subject.color">
            <span class="tag">{{ categoryName(subject.categoryId) }}</span><h2><a [routerLink]="['/subjects', subject.id]">{{ subject.name }}</a></h2>
            <p>{{ subject.description || 'Aucune description.' }}</p>
          </article> } @empty { <div class="empty">✿ Aucune matière à afficher.</div> }
        </div>
      }
    </sb-state>
    @if (actionError()) { <p class="notice" role="alert">{{ actionError() }}</p> }
    <dialog #editor><form [formGroup]="form" (ngSubmit)="save(editor)">
      <h2>{{ editing ? 'Modifier la matière' : 'Nouvelle matière' }}</h2>
      <label>Nom <input formControlName="name">@if (form.controls.name.touched && form.controls.name.invalid) { <small>Saisissez entre 2 et 80 caractères.</small> }</label>
      <label>Catégorie <select formControlName="categoryId"><option value="">Choisir une catégorie</option>@for (item of categories.items(); track item.id) { <option [value]="item.id">{{ item.name }}</option> }</select>@if (form.controls.categoryId.touched && form.controls.categoryId.invalid) { <small>Choisissez une catégorie.</small> }</label>
      <label>Couleur <input type="color" formControlName="color"></label>
      <label>Description <textarea formControlName="description"></textarea>@if (form.controls.description.touched && form.controls.description.invalid) { <small>Limite de 500 caractères.</small> }</label>
      @if (actionError()) { <p class="notice" role="alert">{{ actionError() }}</p> }
      <div class="row"><button type="button" class="quiet" (click)="editor.close()">Annuler</button><button class="primary" [disabled]="form.invalid || saving()">Enregistrer</button></div>
    </form></dialog>
    <dialog #confirmation><h2>Supprimer la matière ?</h2><p>Les tâches associées seront aussi supprimées.</p><div class="row"><button class="quiet" (click)="confirmation.close()">Annuler</button><button class="primary" [disabled]="saving()" (click)="remove(confirmation)">Supprimer</button></div></dialog>`
})
export class SubjectsPage extends PageState implements OnInit {
  protected readonly study = inject(StudyService);
  protected readonly categories = inject(CategoryService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected readonly search = signal('');
  protected readonly category = signal('');
  protected readonly selected = computed(() => this.study.subjects.items().find(item => item.id === this.id));
  protected readonly filtered = computed(() => this.study.subjects.items().filter(item =>
    item.name.toLocaleLowerCase('fr').includes(this.search().toLocaleLowerCase('fr').trim()) &&
    (!this.category() || item.categoryId === this.category())));
  protected editing?: Subject;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.minLength(2), Validators.maxLength(80)]],
    description: ['', Validators.maxLength(500)],
    color: ['#a9c8e8', Validators.required],
    categoryId: ['', Validators.required]
  });
  ngOnInit() { this.load(); }
  protected load() {
    this.read(this.categories.load().pipe(switchMap(() => this.study.load())), () => {
      if (this.id && !this.selected()) this.error.set('Cette matière est introuvable.');
    });
  }
  protected categoryName(id: string) { return this.categories.items().find(category => category.id === id)?.name; }
  protected hasTasks(id: string) { return this.study.tasks.items().some(task => task.subjectId === id); }
  protected open(dialog: HTMLDialogElement, subject?: Subject) {
    this.actionError.set('');
    this.editing = subject;
    this.form.reset(subject ?? { color: '#a9c8e8' });
    dialog.showModal();
  }
  protected save(dialog: HTMLDialogElement) {
    const user = this.auth.currentUser();
    if (!user || this.saving() || this.form.invalid) return;
    const value = this.form.getRawValue();
    const request = this.editing ? this.study.subjects.update(this.editing.id, value)
      : this.study.subjects.create({ ...value, userId: user.id, createdAt: new Date().toISOString() });
    this.write(request, 'Matière enregistrée.', () => dialog.close());
  }
  protected remove(dialog: HTMLDialogElement) {
    const item = this.selected();
    if (!item || this.saving()) return;
    dialog.close();
    this.write(this.study.tasks.query([item.id]).pipe(
      switchMap(tasks => from(tasks).pipe(concatMap(task => this.study.tasks.remove(task.id)), toArray())),
      switchMap(() => this.study.subjects.remove(item.id))
    ), 'Matière supprimée.', () => void this.router.navigateByUrl('/subjects'));
  }
}
