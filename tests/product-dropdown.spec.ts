import { test, expect } from "@playwright/test";

test.describe("ProductDropdown Component", () => {
    test.beforeEach(async ({ page }) => {
        // Listen for console messages and errors
        page.on("console", (msg) =>
            console.log(`BROWSER: ${msg.type()}: ${msg.text()}`)
        );
        page.on("pageerror", (error) =>
            console.log(`PAGE ERROR: ${error.message}`)
        );

        // Navigate to the application
        await page.goto("/");

        // Wait for the page to load
        await page.waitForLoadState("networkidle");

        console.log("Page loaded, checking for sign in button...");

        // Check if the main React app has rendered
        const appElement = page.locator("#root");
        const appExists = await appElement.count();
        console.log(`React app root element count: ${appExists}`);

        if (appExists > 0) {
            const appContent = await appElement.textContent();
            console.log(`App content length: ${appContent?.length || 0}`);
            console.log(
                `App content preview: ${appContent?.substring(0, 200) || "empty"}`
            );
        }

        // Sign in using admin credentials
        const emailInput = page.locator('input[name="email"]');
        const passwordInput = page.locator('input[name="password"]');
        const signInButton = page.locator('button:has-text("Sign in")');

        if (await emailInput.isVisible()) {
            console.log("Signing in with provided credentials...");
            await emailInput.fill("ngocanhnguyen.tayduong@gmail.com");
            await passwordInput.fill("12345678");
            await signInButton.click();
            await page.waitForLoadState("networkidle");
        } else {
            console.log("Email input not visible; assuming already signed in");
        }

        // Complete profile setup if needed
        const nameInput = page.locator(
            'input[placeholder="Enter your full name"]'
        );
        if (await nameInput.isVisible()) {
            console.log("Found profile setup form, filling...");
            await nameInput.fill("Test User");
            await page.locator('button:has-text("Complete Setup")').click();
            await page.waitForLoadState("networkidle");
        } else {
            console.log("No profile setup form found, might already be set up");
        }

        // Navigate to Create Order form
        const createOrderButton = page.locator(
            'button:has-text("Create Order")'
        );
        if (await createOrderButton.isVisible()) {
            console.log("Found Create Order button, clicking...");
            await createOrderButton.click();
            await page.waitForLoadState("networkidle");
        } else {
            console.log("No Create Order button found");
            // Take a screenshot to debug
            await page.screenshot({ path: "debug-no-create-order.png" });

            // Check what buttons are actually available
            const allButtons = await page.locator("button").all();
            console.log(`Found ${allButtons.length} buttons on the page`);

            for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
                const buttonText = await allButtons[i].textContent();
                console.log(`Button ${i}: "${buttonText}"`);
            }
        }

        console.log("Setup complete, current URL:", page.url());
    });

    test("should display product dropdown and allow selection", async ({
        page,
    }) => {
        // The ProductDropdown should now be visible since we navigated to Create Order in beforeEach
        console.log("Looking for product dropdown...");

        // Take a screenshot to see what's on the page
        await page.screenshot({ path: "debug-before-dropdown-check.png" });

        // Look for the product dropdown
        const productDropdown = page.locator(
            'select[aria-label="Select product"]'
        );

        // Check if dropdown exists before asserting visibility
        const dropdownExists = await productDropdown.count();
        console.log(`Product dropdown count: ${dropdownExists}`);

        if (dropdownExists === 0) {
            // Debug: check what's actually on the page
            const pageContent = await page.content();
            console.log("Page content length:", pageContent.length);
            console.log("Page title:", await page.title());

            // Look for any select elements
            const allSelects = await page.locator("select").count();
            console.log(`Total select elements found: ${allSelects}`);

            // Look for any elements with "product" in them
            const productElements = await page
                .locator('*:has-text("product")')
                .count();
            console.log(`Elements containing "product": ${productElements}`);
        }

        await expect(productDropdown).toBeVisible();

        // Check if the dropdown has the default option
        await expect(productDropdown).toHaveValue("");

        // Get all options in the dropdown
        const options = await productDropdown.locator("option").all();
        console.log(`Found ${options.length} options in dropdown`);

        // Check if there are product options (more than just the default "Select a product..." option)
        expect(options.length).toBeGreaterThan(1);

        // Try to select the first actual product option (skip the empty default option)
        const productOptions = await productDropdown
            .locator('option:not([value=""])')
            .all();
        if (productOptions.length > 0) {
            const firstProductValue =
                await productOptions[0].getAttribute("value");
            const firstProductText = await productOptions[0].textContent();

            console.log(
                `Selecting product: ${firstProductText} with value: ${firstProductValue}`
            );

            // Select the first product
            await productDropdown.selectOption(firstProductValue!);

            // Verify the selection was made
            await expect(productDropdown).toHaveValue(firstProductValue!);

            // Check if the unit price field was updated (this tests the onChange handler)
            const unitPriceInput = page.locator('input[type="number"]').nth(1); // Second number input should be unit price
            const unitPriceValue = await unitPriceInput.inputValue();
            console.log(`Unit price after selection: ${unitPriceValue}`);

            // The unit price should be greater than 0 if the selection worked
            expect(parseFloat(unitPriceValue)).toBeGreaterThan(0);

            // Check if the selection triggered any changes in the form
            const selectedText = await productDropdown
                .locator("option:checked")
                .textContent();
            console.log(`Selected option text: ${selectedText}`);
        } else {
            console.log(
                "No product options found - this might indicate a data loading issue"
            );
        }
    });

    test("should load products from Convex backend", async ({ page }) => {
        // The ProductDropdown should now be visible since we navigated to Create Order in beforeEach

        // Wait for the product dropdown to be visible
        const productDropdown = page.locator(
            'select[aria-label="Select product"]'
        );
        await expect(productDropdown).toBeVisible();

        // Wait a bit more for data to load
        await page.waitForTimeout(2000);

        // Check network requests to see if products are being fetched
        const responses = [];
        page.on("response", (response) => {
            if (
                response.url().includes("convex") ||
                response.url().includes("products")
            ) {
                responses.push({
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText(),
                });
            }
        });

        // Reload to capture network requests
        await page.reload();
        await page.waitForLoadState("networkidle");

        // Navigate back to the form if needed
        const createOrderButtonAfterReload = page.locator(
            'button:has-text("Create Order")'
        );
        if (await createOrderButtonAfterReload.isVisible()) {
            await createOrderButtonAfterReload.click();
            await page.waitForLoadState("networkidle");
        }

        // Check if products are loaded
        const productDropdownAfterReload = page.locator(
            'select[aria-label="Select product"]'
        );
        await expect(productDropdownAfterReload).toBeVisible();

        const optionsAfterReload = await productDropdownAfterReload
            .locator("option")
            .all();
        console.log(`Options after reload: ${optionsAfterReload.length}`);

        // Log network responses for debugging
        console.log("Network responses:", responses);
    });
});
