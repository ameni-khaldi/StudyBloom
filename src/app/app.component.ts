import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar';
import { ToastComponent } from './components/toast/toast';
import { AuthService } from './services/auth';
@Component({ selector: 'app-root', imports: [RouterOutlet, SidebarComponent, ToastComponent], templateUrl: './app.component.html' })
export class AppComponent { protected readonly auth = inject(AuthService); }
