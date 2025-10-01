import { test, expect } from '@playwright/test';

test.describe('Email Update and Login Test', () => {
  const adminEmail = 'ngocanhnguyen.tayduong@gmail.com';
  const adminPassword = '12345678';
  
  const testUserEmail = 'testuser@example.com';
  const testUserNewEmail = 'testuser.new@example.com';
  const testUserPassword = 'testpass123';
  const testUserName = 'Test User';

  test('should allow login after email update', async ({ page }) => {
    // Step 1: Login as admin
    await page.goto('http://localhost:5174/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in admin credentials
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await page.waitForTimeout(2000);
    
    // Step 2: Navigate to User Management
    // Look for User Management link or button
    const userManagementLink = page.locator('text=User Management').or(page.locator('text=Users'));
    await userManagementLink.click();
    
    await page.waitForTimeout(1000);
    
    // Step 3: Create a test user
    await page.click('text=Add New User');
    await page.waitForTimeout(500);
    
    // Fill in user details
    await page.fill('input[type="email"]', testUserEmail);
    await page.fill('input[placeholder="Full Name"]', testUserName);
    await page.fill('input[type="password"]', testUserPassword);
    
    // Select role (sales by default)
    await page.selectOption('select', 'sales');
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Create User")');
    
    // Wait for success message
    await page.waitForTimeout(2000);
    
    // Step 4: Edit the user's email
    // Find the test user in the table and click Edit
    const userRow = page.locator(`tr:has-text("${testUserEmail}")`);
    await userRow.locator('button:has-text("Edit")').click();
    
    await page.waitForTimeout(500);
    
    // Change the email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.clear();
    await emailInput.fill(testUserNewEmail);
    
    // Submit the update
    await page.click('button[type="submit"]:has-text("Update User")');
    
    // Wait for success message
    await page.waitForTimeout(2000);
    
    // Step 5: Sign out
    const signOutButton = page.locator('text=Sign Out').or(page.locator('button:has-text("Sign Out")'));
    await signOutButton.click();
    
    await page.waitForTimeout(1000);
    
    // Step 6: Try to login with NEW email and OLD password
    await page.fill('input[name="email"]', testUserNewEmail);
    await page.fill('input[name="password"]', testUserPassword);
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Wait for login attempt
    await page.waitForTimeout(2000);
    
    // Verify successful login - check for user profile or dashboard elements
    // This should NOT show an error message
    const errorToast = page.locator('text=Invalid password').or(page.locator('text=Could not sign in'));
    await expect(errorToast).not.toBeVisible({ timeout: 3000 });
    
    // Verify we're logged in by checking for user-specific elements
    const userProfile = page.locator(`text=${testUserName}`).or(page.locator('text=Dashboard'));
    await expect(userProfile).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Test passed: User can login with new email and old password');
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Delete the test user if it exists
    try {
      // Login as admin if not already logged in
      await page.goto('http://localhost:5174/');
      await page.waitForTimeout(1000);
      
      const signInButton = page.locator('button[type="submit"]:has-text("Sign in")');
      if (await signInButton.isVisible()) {
        await page.fill('input[name="email"]', adminEmail);
        await page.fill('input[name="password"]', adminPassword);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      }
      
      // Navigate to User Management
      const userManagementLink = page.locator('text=User Management').or(page.locator('text=Users'));
      if (await userManagementLink.isVisible()) {
        await userManagementLink.click();
        await page.waitForTimeout(1000);
        
        // Try to delete test user with old email
        let userRow = page.locator(`tr:has-text("${testUserEmail}")`);
        if (await userRow.isVisible()) {
          await userRow.locator('button:has-text("Delete")').click();
          await page.waitForTimeout(500);
          // Confirm deletion
          page.on('dialog', dialog => dialog.accept());
          await page.waitForTimeout(1000);
        }
        
        // Try to delete test user with new email
        userRow = page.locator(`tr:has-text("${testUserNewEmail}")`);
        if (await userRow.isVisible()) {
          await userRow.locator('button:has-text("Delete")').click();
          await page.waitForTimeout(500);
          // Confirm deletion
          page.on('dialog', dialog => dialog.accept());
          await page.waitForTimeout(1000);
        }
      }
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  });
});

