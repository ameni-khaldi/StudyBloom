import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { tokenInterceptor } from './interceptors/token';
import { apiUrl, TaskService } from './services/api';
import { AuthService } from './services/auth';
import { DeadlinePipe } from './pipes/deadline';
import { futureDeadlineValidator } from './validators/deadline';
import { BloomGardenComponent } from './components/bloom-garden/bloom-garden';
import { Task, User } from './models/study';

describe('StudyBloom', () => {
  const student: User = { id: 'u1', name: 'Lina', email: 'lina@studybloom.test', password: 'Bloom2027!', role: 'student', active: true, createdAt: '2026-11-20' };
  const task: Task = { id: 't1', subjectId: 's1', title: 'Exercice Angular', status: 'done', priority: 'high', dueDate: '2099-01-01', createdAt: '2026-11-20' };
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.removeItem('studybloom-session');
    TestBed.configureTestingModule({ providers: [
      provideRouter(routes), provideHttpClient(withInterceptors([tokenInterceptor])), provideHttpClientTesting()
    ] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); sessionStorage.removeItem('studybloom-session'); });

  it('redirection vers la connexion pour un visiteur', async () => {
    const harness = await RouterTestingHarness.create('/tasks');
    expect(harness.routeNativeElement?.textContent).toContain('Bon retour');
  });

  it('ouvre une session étudiante et joint le jeton à la requête suivante', () => {
    const auth = TestBed.inject(AuthService);
    auth.login(student.email, student.password).subscribe();
    http.expectOne(req => req.url === apiUrl + '/users').flush([student]);
    expect(auth.currentUser()?.id).toBe(student.id);
    expect(auth.isAdmin()).toBeFalse();
    TestBed.inject(TaskService).query(['s1'], 'Angular+').subscribe();
    const request = http.expectOne(req => req.url === apiUrl + '/tasks');
    expect(request.request.headers.get('Authorization')).toBe('Bearer ' + auth.token());
    expect(request.request.params.get('title_like')).toBe('Angular\\+');
    expect(request.request.params.get('subjectId')).toBe('s1');
    request.flush([task]);
  });

  it('rejette un compte désactivé et un mauvais mot de passe', () => {
    const auth = TestBed.inject(AuthService);
    const error = jasmine.createSpy('error');
    auth.login(student.email, student.password).subscribe({ error });
    http.expectOne(req => req.url === apiUrl + '/users').flush([{ ...student, active: false }]);
    auth.login(student.email, 'erroné').subscribe({ error });
    http.expectOne(req => req.url === apiUrl + '/users').flush([student]);
    expect(error).toHaveBeenCalledTimes(2);
    expect(auth.isAuthenticated()).toBeFalse();
  });

  it('met à jour les compteurs après les modifications', () => {
    const tasks = TestBed.inject(TaskService);
    tasks.refresh(['s1']).subscribe();
    http.expectOne(req => req.url === apiUrl + '/tasks').flush([task]);
    expect(tasks.progress()).toBe(1);
    tasks.update(task.id, { status: 'todo' }).subscribe();
    http.expectOne({ url: apiUrl + '/tasks/t1', method: 'PATCH' }).flush({ ...task, status: 'todo' });
    expect(tasks.remaining()).toBe(1);
    tasks.remove(task.id).subscribe();
    http.expectOne({ url: apiUrl + '/tasks/t1', method: 'DELETE' }).flush(null);
    expect(tasks.progress()).toBe(0);
  });

  it('décrit les échéances relatives', () => {
    const pipe = new DeadlinePipe();
    expect(pipe.transform('2026-11-25', '2026-11-26')).toBe('En retard');
    expect(pipe.transform('2026-11-26', '2026-11-26')).toBe('Aujourd’hui');
    expect(pipe.transform('2026-11-27', '2026-11-26')).toBe('Demain');
    expect(pipe.transform('2026-11-30', '2026-11-26')).toBe('Dans 4 jours');
  });

  it('refuse une échéance passée sauf si elle est conservée lors de l’édition', () => {
    expect(new FormControl('2000-01-01', futureDeadlineValidator()).hasError('pastDeadline')).toBeTrue();
    expect(new FormControl('2000-01-01', futureDeadlineValidator('2000-01-01')).valid).toBeTrue();
    expect(new FormControl('2099-01-01', futureDeadlineValidator()).valid).toBeTrue();
  });

  it('affiche les cinq étapes du jardin aux seuils attendus', () => {
    const fixture = TestBed.createComponent(BloomGardenComponent);
    const element: HTMLElement = fixture.nativeElement;
    for (const [progress, title] of [[0, 'Graine'], [.25, 'Jeune pousse'], [.50, 'Plante'], [.75, 'Bouton floral'], [1, 'Fleur épanouie']] as const) {
      fixture.componentRef.setInput('progress', progress);
      fixture.detectChanges();
      expect(element.querySelector('h2')?.textContent).toContain(title);
    }
  });
});
