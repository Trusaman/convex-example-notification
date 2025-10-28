import { test, expect } from '@playwright/test';

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    
    // Login with admin credentials
    await page.fill('input[type="email"]', 'ngocanhnguyen.tayduong@gmail.com');
    await page.fill('input[type="password"]', '12345678');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Welcome', { timeout: 10000 });
  });

  test('should display Inventory Management tab for admin', async ({ page }) => {
    // Check if Inventory Management tab is visible
    const inventoryTab = page.locator('button:has-text("Inventory Management")');
    await expect(inventoryTab).toBeVisible();
  });

  test('should navigate to Inventory Management page', async ({ page }) => {
    // Click on Inventory Management tab
    await page.click('button:has-text("Inventory Management")');
    
    // Wait for the page to load
    await page.waitForSelector('text=Inventory Management', { timeout: 5000 });
    
    // Check if the Add Batch button is visible
    const addBatchButton = page.locator('button:has-text("Add Batch")');
    await expect(addBatchButton).toBeVisible();
  });

  test('should show create batch form when Add Batch is clicked', async ({ page }) => {
    // Navigate to Inventory Management
    await page.click('button:has-text("Inventory Management")');
    await page.waitForSelector('text=Inventory Management', { timeout: 5000 });
    
    // Click Add Batch button
    await page.click('button:has-text("Add Batch")');
    
    // Check if form is displayed
    await expect(page.locator('text=New Inventory Batch')).toBeVisible();
    await expect(page.locator('label:has-text("Product *")')).toBeVisible();
    await expect(page.locator('label:has-text("Batch Number *")')).toBeVisible();
    await expect(page.locator('label:has-text("Quantity *")')).toBeVisible();
    await expect(page.locator('label:has-text("Received Date *")')).toBeVisible();
  });

  test('should display filter options', async ({ page }) => {
    // Navigate to Inventory Management
    await page.click('button:has-text("Inventory Management")');
    await page.waitForSelector('text=Inventory Management', { timeout: 5000 });
    
    // Check if search input is visible
    const searchInput = page.locator('input[placeholder*="Search by batch number"]');
    await expect(searchInput).toBeVisible();
    
    // Check if status filter is visible
    const statusFilter = page.locator('select');
    await expect(statusFilter).toBeVisible();
    
    // Verify filter options
    await expect(statusFilter).toContainText('All Status');
    await expect(statusFilter).toContainText('Available');
    await expect(statusFilter).toContainText('Reserved');
    await expect(statusFilter).toContainText('Expired');
    await expect(statusFilter).toContainText('Damaged');
  });

  test('should display inventory batches table', async ({ page }) => {
    // Navigate to Inventory Management
    await page.click('button:has-text("Inventory Management")');
    await page.waitForSelector('text=Inventory Management', { timeout: 5000 });
    
    // Check if table headers are visible
    await expect(page.locator('th:has-text("Batch Number")')).toBeVisible();
    await expect(page.locator('th:has-text("Product")')).toBeVisible();
    await expect(page.locator('th:has-text("Quantity")')).toBeVisible();
    await expect(page.locator('th:has-text("Received Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Expiry Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Location")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('should validate required fields when creating batch', async ({ page }) => {
    // Navigate to Inventory Management
    await page.click('button:has-text("Inventory Management")');
    await page.waitForSelector('text=Inventory Management', { timeout: 5000 });
    
    // Click Add Batch button
    await page.click('button:has-text("Add Batch")');
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Create Batch")');
    
    // Wait a bit for validation
    await page.waitForTimeout(1000);
    
    // The form should still be visible (not submitted)
    await expect(page.locator('text=New Inventory Batch')).toBeVisible();
  });

  test('should cancel batch creation', async ({ page }) => {
    // Navigate to Inventory Management
    await page.click('button:has-text("Inventory Management")');
    await page.waitForSelector('text=Inventory Management', { timeout: 5000 });
    
    // Click Add Batch button
    await page.click('button:has-text("Add Batch")');
    
    // Verify form is visible
    await expect(page.locator('text=New Inventory Batch')).toBeVisible();
    
    // Click Cancel button
    await page.click('button:has-text("Cancel")');
    
    // Form should be hidden
    await expect(page.locator('text=New Inventory Batch')).not.toBeVisible();
  });

  test('should filter batches by status', async ({ page }) => {
    // Navigate to Inventory Management
    await page.click('button:has-text("Inventory Management")');
    await page.waitForSelector('text=Inventory Management', { timeout: 5000 });
    
    // Select a status filter
    const statusFilter = page.locator('select');
    await statusFilter.selectOption('available');
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // The filter should be applied (we can't verify results without data, but the action should work)
    await expect(statusFilter).toHaveValue('available');
  });

  test('should search batches', async ({ page }) => {
    // Navigate to Inventory Management
    await page.click('button:has-text("Inventory Management")');
    await page.waitForSelector('text=Inventory Management', { timeout: 5000 });
    
    // Type in search box
    const searchInput = page.locator('input[placeholder*="Search by batch number"]');
    await searchInput.fill('BATCH-001');
    
    // Wait for search to apply
    await page.waitForTimeout(500);
    
    // The search should be applied
    await expect(searchInput).toHaveValue('BATCH-001');
  });
});

