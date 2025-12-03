import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('https://salesproxy.518166.com.cn/');
  await expect(page).toHaveTitle(/Sales Proxy/);
});

test('dashboard test', async ({ page }) => {
  await page.goto('https://salesproxy.518166.com.cn/dashboard');
  // Just check if page loads without errors
  await expect(page.locator('body')).toBeVisible();
});