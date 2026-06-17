import { test, expect } from '@playwright/test';

test.describe('Authentication Flow & Dashboard E2E', () => {

  test('should display error toast on invalid login', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid_user@example.com');
    await page.fill('input[type="password"]', 'wrongpassword123');

    // Click the Sign In button
    await page.click('button:has-text("Sign In")');

    // Verify that an error message (toast) appears
    // The exact selector depends on your toast library (e.g., Sonner uses 'data-sonner-toast')
    const toast = page.locator('li[data-sonner-toast]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText('Invalid login credentials');
  });

  test('should successfully login and redirect to /journal, then open Settings', async ({ page }) => {
    // Note: Replace these with valid test credentials for your local Supabase instance
    const TEST_EMAIL = 'rouinhope@gmail.com';
    const TEST_PASSWORD = '1212312121a';

    await page.goto('http://localhost:3000/login');

    // Optional: If you need to test the sign up toggle
    // await page.click('text="Don\'t have an account? Sign up"');

    // Fill in valid credentials
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);

    // Click Sign In
    await page.click('button:has-text("Sign In")');

    // Wait for redirect to /journal
    await page.waitForURL('**/journal');

    // Verify we are on the dashboard by checking for a known element (e.g., Trading Journal title)
    await expect(page.locator('h1:has-text("Trading Journal")')).toBeVisible();

    // Now test opening the Settings Modal
    // Click the user avatar button in the header (which opens Settings)
    // We can target it by its title or aria-label if you added one, or simply the button containing the avatar/initials
    const settingsButton = page.locator('button[title="User Settings"]');
    await settingsButton.click();

    // Verify the Settings modal appears
    const modalTitle = page.locator('h2:has-text("User Settings")');
    await expect(modalTitle).toBeVisible();

    // Verify the Display Name input exists
    const displayNameInput = page.locator('input[placeholder="e.g. John Doe"]');
    await expect(displayNameInput).toBeVisible();
  });

});
