import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { Category, localDate, Subject, Task, User } from '../models/study';

export const apiUrl = 'http://127.0.0.1:3000';

abstract class Collection<T extends { id: string }> {
  private readonly http = inject(HttpClient);
  private readonly state = signal<T[]>([]);
  readonly items = this.state.asReadonly();

  constructor(private readonly collection: string) {}

  list(params?: HttpParams): Observable<T[]> {
    return this.http.get<T[]>(this.url(), { params });
  }
  load(params?: HttpParams): Observable<T[]> {
    return this.list(params).pipe(tap(items => this.state.set(items)));
  }
  get(id: string): Observable<T> {
    return this.http.get<T>(this.url(id));
  }
  create(value: Omit<T, 'id'>): Observable<T> {
    return this.http.post<T>(this.url(), { ...value, id: crypto.randomUUID() })
      .pipe(tap(item => this.state.update(items => [...items, item])));
  }
  update(id: string, value: Partial<Omit<T, 'id'>>): Observable<T> {
    return this.http.patch<T>(this.url(id), value)
      .pipe(tap(item => this.state.update(items => items.map(old => old.id === id ? item : old))));
  }
  remove(id: string): Observable<void> {
    return this.http.delete<void>(this.url(id))
      .pipe(tap(() => this.state.update(items => items.filter(item => item.id !== id))));
  }
  private url(id?: string): string {
    return apiUrl + '/' + this.collection + (id ? '/' + encodeURIComponent(id) : '');
  }
}

@Injectable({ providedIn: 'root' })
export class SubjectService extends Collection<Subject> {
  constructor() { super('subjects'); }
  owned(userId: string) { return this.load(new HttpParams().set('userId', userId)); }
}

@Injectable({ providedIn: 'root' })
export class TaskService extends Collection<Task> {
  constructor() { super('tasks'); }
  readonly done = computed(() => this.items().filter(task => task.status === 'done').length);
  readonly remaining = computed(() => this.items().length - this.done());
  readonly progress = computed(() => this.items().length ? this.done() / this.items().length : 0);
  readonly overdue = computed(() => this.items().filter(task => task.status !== 'done' && task.dueDate < localDate()));
  query(ids: readonly string[], search = '') {
    if (!ids.length) return this.list(new HttpParams().set('subjectId', '__none__'));
    let params = new HttpParams().set('_sort', 'dueDate');
    for (const id of ids) params = params.append('subjectId', id);
    if (search) params = params.set('title_like', search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return this.list(params).pipe(map(tasks => tasks.filter(task => ids.includes(task.subjectId))));
  }
  refresh(ids: readonly string[]) {
    let params = new HttpParams().set('_sort', 'dueDate');
    for (const id of ids.length ? ids : ['__none__']) params = params.append('subjectId', id);
    return this.load(params);
  }
}

@Injectable({ providedIn: 'root' })
export class CategoryService extends Collection<Category> {
  constructor() { super('categories'); }
}

@Injectable({ providedIn: 'root' })
export class UserService extends Collection<User> {
  constructor() { super('users'); }
  byEmail(email: string) { return this.list(new HttpParams().set('email', email)); }
}
