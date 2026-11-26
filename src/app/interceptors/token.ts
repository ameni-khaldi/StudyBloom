import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { apiUrl } from '../services/api';
import { AuthService } from '../services/auth';

export const tokenInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthService).token();
  return next(token && request.url.startsWith(apiUrl + '/')
    ? request.clone({ setHeaders: { Authorization: 'Bearer ' + token } })
    : request);
};
