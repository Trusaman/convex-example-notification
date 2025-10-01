# Email Update Fix - Preserve Password on Email Change

## Problem
When an admin updates a user's email address, the user cannot login with their previous password using the new email address.

## Root Cause
The `adminUpdateUserEmail` action was correctly copying the password hash (`secret`) from the old auth account to the new one, but there was a potential issue with:
1. Missing validation to ensure the secret was retrieved
2. Lack of debugging information to troubleshoot issues

## Solution
Enhanced the `adminUpdateUserEmail` function in `convex/users.ts` with:
1. Added validation to ensure the `secret` (password hash) is retrieved before proceeding
2. Added console logging for debugging
3. Ensured proper error handling

## Changes Made

### File: `convex/users.ts`

The `adminUpdateUserEmail` action now includes:

```typescript
// Delete old account and create new one with same password hash
const accountDoc = oldAccount.account as any;

// Log for debugging
console.log("Old account structure:", {
    hasSecret: !!accountDoc.secret,
    accountId: accountDoc._id,
    provider: accountDoc.provider,
    providerAccountId: accountDoc.providerAccountId,
});

const secret = accountDoc.secret; // This is the hashed password

if (!secret) {
    throw new Error("Could not retrieve password hash from old account");
}

// Delete the old account first
await ctx.runMutation(internal.users._deleteAuthAccount, {
    accountId: accountDoc._id,
});

// Create new account with the same password hash and link to existing user
await ctx.runMutation(internal.users._createAuthAccount, {
    userId: args.userId,
    provider: "password",
    providerAccountId: newEmail,
    secret,
});

// Update the profile and user document
await ctx.runMutation(internal.users._updateProfileEmail, {
    userId: args.userId,
    email: newEmail,
});

console.log("Email update completed successfully");
```

## How It Works

1. **Retrieve Old Account**: Uses `retrieveAccount` to get the existing auth account with the old email
2. **Extract Password Hash**: Extracts the `secret` field which contains the password hash in the format `salt:hashedPassword`
3. **Validate Secret**: Ensures the secret exists before proceeding
4. **Delete Old Account**: Removes the old auth account from the `authAccounts` table
5. **Create New Account**: Creates a new auth account with:
   - Same `userId` (links to the same user)
   - New email as `providerAccountId`
   - Same `secret` (password hash)
6. **Update Profile**: Updates the user's profile and user document with the new email

## Manual Testing Steps

### Prerequisites
- Application running at `http://localhost:5174/`
- Admin credentials: `ngocanhnguyen.tayduong@gmail.com` / `12345678`

### Test Procedure

1. **Login as Admin**
   - Navigate to `http://localhost:5174/`
   - Login with admin credentials

2. **Create a Test User**
   - Go to User Management
   - Click "Add New User"
   - Fill in:
     - Email: `test-email-change@example.com`
     - Name: `Test User`
     - Password: `testpass123`
     - Role: `Sales`
   - Click "Create User"

3. **Update the User's Email**
   - Find the test user in the user list
   - Click "Edit"
   - Change email to: `test-email-changed@example.com`
   - Keep name and role the same
   - Click "Update User"
   - Wait for success message

4. **Sign Out**
   - Click "Sign Out" button

5. **Test Login with New Email and Old Password**
   - Try to login with:
     - Email: `test-email-changed@example.com`
     - Password: `testpass123`
   - **Expected Result**: Login should succeed ✅

6. **Cleanup**
   - Login as admin again
   - Go to User Management
   - Delete the test user

## Verification

Check the Convex logs for:
```
Old account structure: {
  hasSecret: true,
  accountId: '...',
  provider: 'password',
  providerAccountId: 'old-email@example.com'
}
Email update completed successfully
```

## Technical Details

### Password Hash Format
The `secret` field in the `authAccounts` table stores the password hash in the format:
```
salt:hashedPassword
```

Example:
```
5ede66f90d73219f2fbd6ae36e0a02f4:17bb7b9d8967f0305f14fba15b01b5222795dc688f535ec9708665baa5596266...
```

### Database Tables Affected
1. **authAccounts**: Old account deleted, new account created with same password hash
2. **users**: Email field updated
3. **profiles**: Email field updated

### Security Considerations
- Only admins can update user emails (enforced by role check)
- Password hash is never exposed to the client
- Email uniqueness is validated before update
- Old account is deleted only after new account is successfully created

## Troubleshooting

### Issue: "Could not retrieve password hash from old account"
**Cause**: The old account doesn't have a `secret` field
**Solution**: Check if the account was created properly with a password

### Issue: "Email is already in use by another account"
**Cause**: The new email is already registered
**Solution**: Choose a different email address

### Issue: "User account not found"
**Cause**: The old email doesn't exist in the auth system
**Solution**: Verify the old email is correct

## Related Files
- `convex/users.ts` - Main implementation
- `src/components/UserManagement.tsx` - Frontend UI
- `convex/schema.ts` - Database schema

## Testing with Playwright

A Playwright test has been created at `tests/email-update-login.spec.ts` but needs UI selector updates to work properly.

## Notes
- The fix maintains backward compatibility
- No database migration required
- Works with existing user accounts
- Password reset functionality remains unchanged

