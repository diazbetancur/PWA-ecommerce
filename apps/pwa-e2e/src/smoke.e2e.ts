import { expect, Page, test } from '@playwright/test';

const rootBaseUrl = process.env['BASE_URL'] || 'http://localhost:4200';
const rootUrl = new URL(rootBaseUrl);
const appPort = rootUrl.port || '4200';
const demoTenantSlug = 'demo';
const missingTenantSlug = 'missing';

function tenantUrl(slug: string, path = '/'): string {
  return `http://${slug}.localhost:${appPort}${path}`;
}

function buildTenantConfig(slug: string) {
  return {
    tenant: {
      id: `${slug}-tenant`,
      slug,
      displayName: 'Demo Store',
    },
    theme: {
      primary: '#1976d2',
      accent: '#e91e63',
      logoUrl: '/icons/icon-192x192.png',
      faviconUrl: '/favicon.ico',
      cssVars: {
        '--primary': '#1976d2',
        '--accent': '#e91e63',
      },
    },
    features: {},
    limits: {
      products: 100,
      admins: 5,
      storageMB: 512,
    },
    locale: 'es-CO',
    currency: 'COP',
    cdnBaseUrl: '',
  };
}

async function fulfillJson(
  page: Page,
  url: string | RegExp,
  body: unknown,
  status = 200
): Promise<void> {
  await page.route(url, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

async function stubTenantConfig(
  page: Page,
  slug = demoTenantSlug
): Promise<void> {
  await fulfillJson(
    page,
    new RegExp(`/api/public/tenant/${slug}$`),
    buildTenantConfig(slug)
  );
}

async function stubMissingTenantConfig(page: Page): Promise<void> {
  await fulfillJson(
    page,
    new RegExp(`/api/public/tenant/${missingTenantSlug}$`),
    {
      title: 'Tenant not found',
      status: 404,
      detail: 'The tenant does not exist.',
    },
    404
  );
}

async function stubStorefrontBootstrap(page: Page): Promise<void> {
  await fulfillJson(page, /\/api\/store\/banners(\?.*)?$/, []);
  await fulfillJson(page, /\/api\/store\/categories(\?.*)?$/, []);

  await page.route(/\/api\/store\/products(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [],
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
      }),
    });
  });
}

test.describe('Lote D smoke tests', () => {
  test('dominio raiz sin tenant redirige a admin login', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(
      page.getByRole('heading', { name: 'Iniciar Sesión' })
    ).toBeVisible();
  });

  test('tenant valido por subdominio carga una pantalla tenant-aware', async ({
    page,
  }) => {
    await stubTenantConfig(page);

    await page.goto(tenantUrl(demoTenantSlug, '/account/login'));

    await expect(page).toHaveURL(/\/account\/login$/);
    await expect(page.locator('.subtitle')).toContainText('credenciales');
    await expect(
      page.getByRole('link', { name: 'Regístrate aquí' })
    ).toBeVisible();
  });

  test('tenant invalido por subdominio muestra pantalla controlada', async ({
    page,
  }) => {
    await stubMissingTenantConfig(page);

    await page.goto(tenantUrl(missingTenantSlug, '/'));

    await expect(page).toHaveURL(/\/tenant\/not-found$/);
    await expect(
      page.getByRole('heading', { name: 'Comercio No Encontrado' })
    ).toBeVisible();
  });

  test('login tenant muestra el formulario minimo', async ({ page }) => {
    await stubTenantConfig(page);

    await page.goto(tenantUrl(demoTenantSlug, '/account/login'));

    await expect(page.getByLabel('Email *')).toBeVisible();
    await expect(page.getByLabel('Contraseña *')).toBeVisible();
    await expect(
      page.getByRole('link', { name: '¿Olvidaste tu contraseña?' })
    ).toBeVisible();
  });

  test('activate account sin token muestra alerta segura', async ({ page }) => {
    await stubTenantConfig(page);

    await page.goto(tenantUrl(demoTenantSlug, '/account/activate-account'));

    await expect(
      page.getByText(
        'El enlace de activación no es válido o está incompleto. Solicita uno nuevo desde recuperación de contraseña.'
      )
    ).toBeVisible();
  });

  test('forgot password carga sin depender de correo real', async ({
    page,
  }) => {
    await stubTenantConfig(page);

    await page.goto(tenantUrl(demoTenantSlug, '/account/forgot-password'));

    await expect(
      page.getByRole('heading', { name: 'Recuperar Contraseña' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Enviar instrucciones' })
    ).toBeVisible();
  });

  test('reset password sin token muestra alerta segura', async ({ page }) => {
    await stubTenantConfig(page);

    await page.goto(tenantUrl(demoTenantSlug, '/account/reset-password'));

    await expect(
      page.getByText(
        'El enlace de recuperación no es válido o está incompleto. Solicita uno nuevo desde esta misma tienda.'
      )
    ).toBeVisible();
  });

  test('catalogo storefront navega por subdominio y muestra estado vacio controlado', async ({
    page,
  }) => {
    await stubTenantConfig(page);
    await stubStorefrontBootstrap(page);

    await page.goto(tenantUrl(demoTenantSlug, '/'));

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(
      page.getByRole('heading', { name: 'No se encontraron productos' })
    ).toBeVisible();
  });

  test('carrito existe y muestra estado vacio sin backend complejo', async ({
    page,
  }) => {
    await stubTenantConfig(page);

    await page.goto(tenantUrl(demoTenantSlug, '/cart'));

    await expect(
      page.getByRole('heading', { name: 'Carrito de compras' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Tu carrito está vacío' })
    ).toBeVisible();
  });

  test('tenant-admin protegido redirige al login tenant', async ({ page }) => {
    await stubTenantConfig(page);

    await page.goto(tenantUrl(demoTenantSlug, '/tenant-admin'));

    await expect(page).toHaveURL(/\/account\/login$/);
    await expect(
      page.getByRole('heading', { name: 'Iniciar Sesión' })
    ).toBeVisible();
  });
});
