import { computed, inject, Injectable, signal } from '@angular/core';
import { map, switchMap, tap } from 'rxjs';
import { User } from '../models/study';
import { UserService } from './api';

type SessionUser = Omit<User, 'password'>;
interface Session { user: SessionUser; token: string }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly users = inject(UserService);
  private readonly session = signal<Session | null>(this.restore());
  readonly currentUser = computed(() => this.session()?.user);
  readonly token = computed(() => this.session()?.token);
  readonly isAuthenticated = computed(() => !!this.session());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  login(email: string, password: string) {
    return this.users.byEmail(email.trim().toLowerCase()).pipe(
      map(users => {
        const user = users.find(item => item.password === password && item.active);
        if (!user) throw new Error('Identifiants invalides ou compte désactivé.');
        const { password: _password, ...profile } = user;
        void _password;
        return profile;
      }),
      tap(user => {
        const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        const token = encode({ alg: 'none', typ: 'JWT' }) + '.' + encode({ sub: user.id, role: user.role }) + '.';
        const session = { user, token };
        sessionStorage.setItem('studybloom-session', JSON.stringify(session));
        this.session.set(session);
      })
    );
  }
  register(name: string, email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    return this.users.byEmail(normalized).pipe(switchMap(users => {
      if (users.length) throw new Error('Cette adresse est déjà utilisée.');
      return this.users.create({ name: name.trim(), email: normalized, password, role: 'student', active: true, createdAt: new Date().toISOString() });
    }));
  }
  logout() {
    sessionStorage.removeItem('studybloom-session');
    this.session.set(null);
  }
  private restore(): Session | null {
    try { return JSON.parse(sessionStorage.getItem('studybloom-session') ?? 'null') as Session | null; }
    catch { return null; }
  }
}
