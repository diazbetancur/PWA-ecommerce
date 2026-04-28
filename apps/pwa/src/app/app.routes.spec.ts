import { appRoutes } from './app.routes';

describe('appRoutes auth link aliases', () => {
  it('redirects /activate-account to the account activation form', () => {
    const route = appRoutes.find((entry) => entry.path === 'activate-account');

    expect(route).toBeDefined();
    expect(route?.redirectTo).toBe('account/activate-account');
    expect(route?.pathMatch).toBe('full');
  });

  it('redirects /reset-password to the account reset form', () => {
    const route = appRoutes.find((entry) => entry.path === 'reset-password');

    expect(route).toBeDefined();
    expect(route?.redirectTo).toBe('account/reset-password');
    expect(route?.pathMatch).toBe('full');
  });

  it('redirects /forgot-password to the account recovery form', () => {
    const route = appRoutes.find((entry) => entry.path === 'forgot-password');

    expect(route).toBeDefined();
    expect(route?.redirectTo).toBe('account/forgot-password');
    expect(route?.pathMatch).toBe('full');
  });
});
