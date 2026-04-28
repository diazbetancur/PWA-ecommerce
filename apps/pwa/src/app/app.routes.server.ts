import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Dynamic tenant resolution depends on the request host, so wildcard prerender
    // is misleading until the SSR path can receive and propagate the incoming host.
    path: '**',
    renderMode: RenderMode.Server,
  },
];
