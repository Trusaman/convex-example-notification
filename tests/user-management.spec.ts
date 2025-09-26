import { test, expect } from '@playwright/test';

// This test ensures creating a user from the admin panel does NOT mutate the logged-in admin profile.
// It signs in with password credentials, navigates to User Management, submits a new user form
// with a brand-new email, and verifies the current user's name remains unchanged.

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors to aid debugging
    page.on('console', msg => console.log(`BROWSER: ${msg.type()}: ${msg.text()}`));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // If already authenticated as non-admin, sign out first (open avatar -> profile -> Sign out)
    const avatarButton = page.getByRole('button').filter({ hasText: /[A-Z]{1,2}\s+.*(sales|admin|accountant|shipper|warehouse)/i });
    if (await avatarButton.count()) {
      await avatarButton.first().click();
      // Try to click Profile tab then Sign out
      const profileTab = page.getByRole('button', { name: 'Profile' });
      if (await profileTab.isVisible({ timeout: 1000 }).catch(() => false)) {
        await profileTab.click();
      }
      const signOutBtn = page.getByRole('button', { name: 'Sign out' });
      if (await signOutBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await signOutBtn.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Sign in with provided credentials
    await page.getByPlaceholder('Email').fill('ngocanhnguyen.tayduong@gmail.com');
    await page.getByPlaceholder('Password').fill('12345678');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Wait for dashboard or setup
    await page.waitForLoadState('networkidle');

    // If prompted for setup, complete it (edge case)
    const setupName = page.getByPlaceholder('Enter your full name');
    if (await setupName.isVisible().catch(() => false)) {
      await setupName.fill('Admin User');
      await page.getByRole('button', { name: 'Complete Setup' }).click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('creating a new user should not update the current logged-in user', async ({ page }) => {
    // Capture current welcome header (e.g., "Welcome, <Name>")
    const welcome = page.getByRole('heading', { name: /Welcome, / });
    await expect(welcome).toBeVisible();
    const beforeWelcomeText = await welcome.textContent();

    // Navigate to User Management tab (admin only)
    const userMgmtTab = page.getByRole('button', { name: 'User Management' });
    await expect(userMgmtTab).toBeVisible();
    await userMgmtTab.click();

    // Click Add New User
    const addBtn = page.getByRole('button', { name: 'Add New User' });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Fill user form with a brand new email that shouldn't map to an existing auth user
    const uniqueEmail = `e2e-${Date.now()}@example.com`;
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Full Name').fill('E2E Temp User');
    await page.getByLabel('Role').selectOption('sales');

    await page.getByRole('button', { name: 'Create User' }).click();

    // Expect either a toast error or simply that the admin's name hasn't changed
    // Verify welcome header text is unchanged
    await expect(welcome).toHaveText(beforeWelcomeText || /Welcome, /);

    // Optionally, verify that the email field is still present for create (no unexpected switch to Edit)
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toBeVisible();
  });
});

