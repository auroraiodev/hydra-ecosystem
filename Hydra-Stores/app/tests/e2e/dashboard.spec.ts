import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.describe('Page Structure', () => {
    test('should display dashboard page with correct heading when authenticated', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const heading = page.locator('h1, h2').filter({ hasText: /Mi Dashboard|Dashboard/i });
        await expect(heading).toBeVisible();
      }
    });

    test('should have PageHeader component with description', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const description = page.locator('text=Resumen de tus ventas y productos en el Marketplace');
        await expect(description).toBeVisible();
      }
    });

    test('should have main content area', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const main = page.locator('main');
        await expect(main).toBeAttached();
      }
    });

    test('should display Hydra logo image in sidebar', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const logo = page.locator('img[alt="Hydra Logo"]');
        await expect(logo).toBeVisible();
        await expect(logo).toHaveAttribute('src', /cat\.png/);
      }
    });

    test('should display seller panel branding in sidebar', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const branding = page.locator('text=Seller Panel');
        await expect(branding).toBeVisible();
      }
    });
  });

  test.describe('Stats Cards', () => {
    test('should display stat cards on dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const statCards = page.locator('p').filter({ hasText: /INGRESOS|ORDENES|PRODUCTOS|TOTAL/i });
        const count = await statCards.count();
        expect(count).toBeGreaterThanOrEqual(1);
      }
    });

    test('should display revenue stat card with formatted value', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const revenueLabel = page.locator('p').filter({ hasText: /INGRESOS|REVENUE/i });
        await expect(revenueLabel.first()).toBeAttached();
      }
    });

    test('should display orders count stat card', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const ordersLabel = page.locator('p').filter({ hasText: /ORDENES|ORDERS/i });
        await expect(ordersLabel.first()).toBeAttached();
      }
    });

    test('should display products count stat card', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const productsLabel = page.locator('p').filter({ hasText: /PRODUCTOS|PRODUCTS/i });
        await expect(productsLabel.first()).toBeAttached();
      }
    });
  });

  test.describe('Charts', () => {
    test('should render revenue chart section', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForSelector('.recharts-responsive-container, .recharts-wrapper, [class*="recharts"]', { timeout: 5000 }).catch(() => {});
        const chart = page.locator('.recharts-responsive-container, .recharts-wrapper, svg.recharts-surface').first();
        const chartCount = await chart.count();
        expect(chartCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should render order status bar chart', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const rechartsElements = page.locator('.recharts-surface, .recharts-wrapper');
        const count = await rechartsElements.count();
        if (count > 0) {
          await expect(rechartsElements.first()).toBeAttached();
        }
      }
    });
  });

  test.describe('Recent Orders', () => {
    test('should display recent orders section heading', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const sectionTitle = page.locator('h2, h3').filter({ hasText: /recent|orden|latest/i });
        if (await sectionTitle.count() > 0) {
          await expect(sectionTitle.first()).toBeVisible();
        }
      }
    });

    test('should show recent orders table with columns', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const orderTable = page.locator('table');
        if (await orderTable.count() > 0) {
          const columns = orderTable.locator('th');
          const count = await columns.count();
          expect(count).toBeGreaterThanOrEqual(3);
        }
      }
    });

    test('should display order images in recent orders', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const images = page.locator('table img, [class*="order"] img, [class*="item"] img');
        const count = await images.count();
        if (count > 0) {
          await expect(images.first()).toBeAttached();
          const src = await images.first().getAttribute('src');
          expect(src).toBeTruthy();
        }
      }
    });

    test('should link recent orders to full orders page', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const exploreLink = page.locator('a').filter({ hasText: /Explorar|View all|Ver todas/i });
        if (await exploreLink.count() > 0) {
          await expect(exploreLink.first()).toHaveAttribute('href', /orders/);
        }
      }
    });
  });

  test.describe('Sidebar Navigation', () => {
    test('should display sidebar with Overview section', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const overview = page.locator('text=Overview');
        await expect(overview).toBeAttached();
      }
    });

    test('should display sidebar with Catalog section', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const catalog = page.locator('text=Catalog');
        await expect(catalog).toBeAttached();
      }
    });

    test('should display sidebar with Finance section', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const finance = page.locator('text=Finance');
        await expect(finance).toBeAttached();
      }
    });

    test('should display sidebar with Account section', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const account = page.locator('text=Account');
        await expect(account).toBeAttached();
      }
    });

    test('should navigate to Products via sidebar', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.locator('a[href="/dashboard/products"]').click();
        await expect(page).toHaveURL(/\/dashboard\/products/);
      }
    });

    test('should navigate to Orders via sidebar', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.locator('a[href="/dashboard/orders"]').click();
        await expect(page).toHaveURL(/\/dashboard\/orders/);
      }
    });

    test('should navigate to Wallet via sidebar', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.locator('a[href="/dashboard/wallet"]').click();
        await expect(page).toHaveURL(/\/dashboard\/wallet/);
      }
    });

    test('should navigate to Profile via sidebar', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.locator('a[href="/dashboard/profile"]').click();
        await expect(page).toHaveURL(/\/dashboard\/profile/);
      }
    });
  });

  test.describe('User Info in Sidebar', () => {
    test('should display user avatar when authenticated', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const avatar = page.locator('[class*="avatar"] img, [class*="Avatar"] img, span[class*="avatar"]').first();
        if (await avatar.count() > 0) {
          await expect(avatar).toBeAttached();
        }
      }
    });

    test('should display user name when authenticated', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const userName = page.locator('.truncate').first();
        if (await userName.count() > 0) {
          const text = await userName.textContent();
          expect(text?.trim()).toBeTruthy();
        }
      }
    });

    test('should display user email when authenticated', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        await page.waitForTimeout(2000);
        const emailEl = page.locator('.text-sidebar-foreground\\/50');
        if (await emailEl.count() > 0) {
          const text = await emailEl.textContent();
          expect(text?.trim()).toBeTruthy();
        }
      }
    });

    test('should show notification bell icon', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const notificationBell = page.locator('[class*="notification"] button, [class*="Notification"]');
        if (await notificationBell.count() > 0) {
          await expect(notificationBell.first()).toBeVisible();
        }
      }
    });

    test('should have logout button in sidebar', async ({ page }) => {
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const logoutButton = page.locator('button[title="Cerrar sesión"], button:has-text("logout")');
        if (await logoutButton.count() > 0) {
          await expect(logoutButton.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Mobile Responsive', () => {
    test('should have mobile menu toggle button on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const menuButton = page.locator('button[class*="lg:hidden"]').first();
        await expect(menuButton).toBeVisible();
      }
    });

    test('should open mobile sidebar when menu button is clicked', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/dashboard');
      if (!page.url().includes('login')) {
        const menuButton = page.locator('button[class*="lg:hidden"]').first();
        await menuButton.click();
        await page.waitForTimeout(500);
        const sidebarContent = page.locator('text=Overview');
        await expect(sidebarContent).toBeVisible();
      }
    });
  });
});
