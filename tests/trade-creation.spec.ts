import { test, expect } from '@playwright/test';

test.describe('Trade Creation Flow E2E', () => {

  test('should successfully log a new open trade from the calendar', async ({ page }) => {
    // 1. Setup - Use the existing test credentials
    const TEST_EMAIL = 'rouinhope@gmail.com';
    const TEST_PASSWORD = '1212312121a';

    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard to load
    await page.waitForURL('**/journal');
    await expect(page.locator('h1:has-text("Trading Journal")')).toBeVisible();

    // 2. Open Trade Modal
    // We click the last available non-disabled day in the calendar
    const availableDay = page.locator('button:not([disabled])[aria-label^="Day"]').last();
    await expect(availableDay).toBeVisible();
    await availableDay.click();

    // 3. Click Add New Trade
    const addTradeBtn = page.locator('button:has-text("+ Add New Trade")');
    await expect(addTradeBtn).toBeVisible();
    await addTradeBtn.click();

    // 4. Fill out the Trade Form
    const testPair = 'ETH/USD';

    // Fill Trading Pair
    const pairInput = page.locator('input[placeholder="e.g. BTC/USDT (Press Enter to save)"]');
    await pairInput.fill(testPair);

    // Click 'Long' direction (it defaults to Long, but we can explicitly click it)
    await page.click('button:has-text("Long")');

    // Fill Entry Price
    const entryInput = page.locator('input[placeholder="0.00"]').first();
    await entryInput.fill('3500.50');

    // Fill Position Size
    const sizeInput = page.locator('input[placeholder="Qty / Units"]');
    await sizeInput.fill('2.5');

    // Select an Emotion (e.g., Confident)
    await page.click('button:has-text("Confident")');

    // 5. Submit the Form
    const saveButton = page.locator('button:has-text("Save Trade")');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // 6. Verify the trade was added
    // After saving, the form closes and returns to the daily trade list within the modal
    // We look for the newly created pair name in the list
    const tradeEntry = page.locator(`span:has-text("${testPair}")`).first();
    await expect(tradeEntry).toBeVisible({ timeout: 5000 });
  });

});
