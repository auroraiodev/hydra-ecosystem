# Testing Guide

## Prerequisites

1. **Backend Setup**
   - Backend should be running on `http://localhost:3002`
   - Database should be connected and seeded with roles
   - Environment variables should be configured

2. **Frontend Setup**
   - Install dependencies: `pnpm install`
   - Create `.env.local` with Supabase credentials
   - Configure Supabase redirect URLs

## Testing Database Connection

### Option 1: Using the Health Endpoint

```bash
# Test backend health (includes database check)
curl http://localhost:3002/api/health
```

Expected response:

```json
{
  "status": "ok",
  "database": "connected",
  "roles": 3,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Option 2: Using the Test Script

```bash
cd hydra-fe
node scripts/test-connection.js
```

This script will:

- Test the health endpoint
- Verify the OAuth endpoint exists
- Check database connectivity

## Testing OAuth Flow

### 1. Start Services

**Terminal 1 - Backend:**

```bash
cd hydra-be
pnpm start:dev
```

**Terminal 2 - Frontend:**

```bash
cd hydra-fe
pnpm dev
```

### 2. Test OAuth Login

1. Navigate to `http://localhost:3000/login`
2. Click "Continue with Google"
3. Complete Google OAuth flow
4. You should be redirected to home page with authentication

### 3. Verify Authentication

- Check browser console for any errors
- Verify user data is displayed on home page
- Check Redux DevTools (if installed) for auth state
- Verify localStorage has `token` and `user` entries

## Testing Account Linking

1. Create a user account with email/password
2. Logout
3. Login with Google using the same email
4. The accounts should be automatically linked
5. You should see a success message

## Common Issues

### Backend Connection Failed

**Symptoms:**

- Error: "Backend sync failed"
- Network error in console

**Solutions:**

1. Verify backend is running: `curl http://localhost:3002/api/health`
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Verify CORS is enabled in backend

### Database Connection Failed

**Symptoms:**

- Health endpoint returns `"database": "disconnected"`
- Backend fails to start

**Solutions:**

1. Check `DATABASE_URL` in backend `.env`
2. Verify database is accessible
3. Run database migrations: `cd hydra-be && pnpm prisma db push`
4. Seed database: `cd hydra-be && pnpm db:seed`

### OAuth Redirect Error

**Symptoms:**

- Redirect URL mismatch error
- OAuth callback fails

**Solutions:**

1. Verify redirect URL in Supabase Dashboard:
   - Go to Authentication > URL Configuration
   - Add: `http://localhost:3000/api/auth/oauth/callback`
2. Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Verify Google OAuth is enabled in Supabase

### Missing Environment Variables

**Symptoms:**

- "OAuth is not available" error
- Supabase client fails to initialize

**Solutions:**

1. Create `.env.local` in `hydra-fe` directory
2. Add required variables (see `README_SETUP.md`)
3. Restart the development server

## Manual API Testing

### Test OAuth Endpoint Directly

```bash
curl -X POST http://localhost:3002/api/auth/oauth/supabase \
  -H "Content-Type: application/json" \
  -d '{
    "supabaseUserId": "test-user-id",
    "email": "test@example.com",
    "provider": "google",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Expected response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "username": "test",
    "first_name": "Test",
    "last_name": "User",
    "role": {
      "id": "...",
      "name": "CLIENT",
      "display_name": "Client"
    }
  },
  "isNewUser": true
}
```

## Debugging Tips

1. **Check Browser Console**
   - Look for network errors
   - Check for JavaScript errors
   - Verify API calls are being made

2. **Check Backend Logs**
   - Look for authentication errors
   - Check database query errors
   - Verify request payloads

3. **Check Network Tab**
   - Verify OAuth callback request
   - Check backend API responses
   - Look for CORS errors

4. **Verify Environment Variables**

   ```bash
   # Frontend
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_API_URL

   # Backend
   echo $DATABASE_URL
   ```
