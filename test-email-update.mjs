/**
 * Manual test script to verify email update preserves password
 *
 * This script will:
 * 1. Login as admin
 * 2. Create a test user
 * 3. Update the test user's email
 * 4. Try to login with the new email and old password
 * 5. Clean up the test user
 */

import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(
    process.env.VITE_CONVEX_URL ||
        "https://accomplished-curlew-646.convex.cloud"
);

const ADMIN_EMAIL = "ngocanhnguyen.tayduong@gmail.com";
const ADMIN_PASSWORD = "12345678";
const TEST_USER_EMAIL = "test-email-update@example.com";
const TEST_USER_NEW_EMAIL = "test-email-updated@example.com";
const TEST_USER_PASSWORD = "testpass123";
const TEST_USER_NAME = "Test Email Update User";

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    console.log("🧪 Starting email update test...\n");

    try {
        // Step 1: Login as admin
        console.log("1️⃣ Logging in as admin...");
        const adminAuth = await client.action("auth:signIn", {
            provider: "password",
            params: {
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                flow: "signIn",
            },
        });
        console.log("✅ Admin logged in successfully\n");
        await sleep(1000);

        // Step 2: Create test user
        console.log("2️⃣ Creating test user...");
        try {
            const createResult = await client.action("users:adminCreateUser", {
                email: TEST_USER_EMAIL,
                name: TEST_USER_NAME,
                password: TEST_USER_PASSWORD,
                role: "sales",
            });
            console.log("✅ Test user created:", createResult);
            console.log("");
            await sleep(1000);
        } catch (error) {
            if (error.message.includes("already")) {
                console.log("⚠️ Test user already exists, continuing...\n");
            } else {
                throw error;
            }
        }

        // Step 3: Get the test user's ID
        console.log("3️⃣ Getting test user details...");
        const allUsers = await client.query("users:getAllUsers");
        const testUser = allUsers.find((u) => u.email === TEST_USER_EMAIL);

        if (!testUser) {
            throw new Error("Test user not found after creation");
        }
        console.log("✅ Test user found:", {
            userId: testUser.userId,
            email: testUser.email,
            name: testUser.name,
        });
        console.log("");
        await sleep(1000);

        // Step 4: Update the test user's email
        console.log("4️⃣ Updating test user's email...");
        const updateResult = await client.action("users:adminUpdateUserEmail", {
            userId: testUser.userId,
            oldEmail: TEST_USER_EMAIL,
            newEmail: TEST_USER_NEW_EMAIL,
        });
        console.log("✅ Email updated:", updateResult);
        console.log("");
        await sleep(2000);

        // Step 5: Sign out admin
        console.log("5️⃣ Signing out admin...");
        await client.action("auth:signOut");
        console.log("✅ Admin signed out\n");
        await sleep(1000);

        // Step 6: Try to login with NEW email and OLD password
        console.log("6️⃣ Testing login with NEW email and OLD password...");
        try {
            const testUserAuth = await client.action("auth:signIn", {
                provider: "password",
                params: {
                    email: TEST_USER_NEW_EMAIL,
                    password: TEST_USER_PASSWORD,
                    flow: "signIn",
                },
            });
            console.log(
                "✅ SUCCESS! Login with new email and old password works!"
            );
            console.log("   Auth result:", testUserAuth);
            console.log("");

            // Sign out test user
            await client.action("auth:signOut");
            await sleep(1000);
        } catch (error) {
            console.log(
                "❌ FAILED! Could not login with new email and old password"
            );
            console.log("   Error:", error.message);
            console.log("");
            throw error;
        }

        // Step 7: Cleanup - Login as admin again and delete test user
        console.log("7️⃣ Cleaning up - logging in as admin again...");
        await client.action("auth:signIn", {
            provider: "password",
            params: {
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                flow: "signIn",
            },
        });
        console.log("✅ Admin logged in\n");
        await sleep(1000);

        console.log("8️⃣ Deleting test user...");
        const updatedUsers = await client.query("users:getAllUsers");
        const testUserToDelete = updatedUsers.find(
            (u) => u.email === TEST_USER_NEW_EMAIL
        );

        if (testUserToDelete) {
            await client.mutation("users:deleteUser", {
                profileId: testUserToDelete._id,
            });
            console.log("✅ Test user deleted\n");
        } else {
            console.log("⚠️ Test user not found for deletion\n");
        }

        console.log(
            "🎉 All tests passed! Email update preserves password correctly."
        );
    } catch (error) {
        console.error("\n❌ Test failed:", error.message);
        console.error("Stack:", error.stack);
        process.exit(1);
    }
}

main();
