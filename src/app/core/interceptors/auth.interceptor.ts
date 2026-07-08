import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'ew_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) return next(req);

  const cloned = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });

  return next(cloned);
};
