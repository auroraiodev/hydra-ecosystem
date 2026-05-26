# Troubleshooting "fetch failed" Error

## Error: `fetch failed` on Login Page

This error occurs when the frontend cannot connect to the backend API.

## Quick Checks

### 1. Verify Backend is Running

```bash
# Check if backend is running
curl http://localhost:3002/api/health
```

Expected response:

```json
{
  "status": "ok",
  "database": "connected",
  "roles": 3,
  "timestamp": "..."
}
```

If this fails, start the backend:

```bash
cd hydra-be
pnpm start:dev
```

### 2. Check Environment Variables

Verify `.env.local` in `hydra-fe` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

**Important:**

- The variable name must start with `NEXT_PUBLIC_` to be accessible in the browser
- Restart the Next.js dev server after changing environment variables

### 3. Verify Backend Port

Check what port the backend is running on:

- Default: `3002`
- Check backend logs or `hydra-be/.env` for `PORT` variable

### 4. Check CORS Configuration

The backend should allow requests from `http://localhost:3000`.

Check `hydra-be/src/main.ts`:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  // ...
});
```

### 5. Network/Firewall Issues

- Ensure no firewall is blocking localhost connections
- Try accessing the backend directly: `http://localhost:3002/api/health`
- Check if another service is using port 3002

## Common Solutions

### Solution 1: Backend Not Running

**Symptom:** `fetch failed` error immediately

**Fix:**

```bash
cd hydra-be
pnpm install  # If needed
pnpm start:dev
```

Wait for: `Nest application successfully started`

### Solution 2: Wrong API URL

**Symptom:** Error persists even with backend running

**Fix:**

1. Check backend port in `hydra-be/.env`:

   ```
   PORT=3002
   ```

2. Update `hydra-fe/.env.local`:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3002
   ```

3. Restart frontend:
   ```bash
   cd hydra-fe
   # Stop the server (Ctrl+C)
   pnpm dev
   ```

### Solution 3: CORS Error

**Symptom:** Error in browser console about CORS

**Fix:**

1. Check `hydra-be/src/main.ts` CORS configuration
2. Ensure `FRONTEND_URL` in backend `.env` matches frontend URL
3. Restart backend

### Solution 4: Database Connection Issue

**Symptom:** Backend starts but health check fails

**Fix:**

1. Check `DATABASE_URL` in `hydra-be/.env`
2. Test database connection:
   ```bash
   cd hydra-be
   pnpm prisma db push
   ```

## Testing the Connection

### Test Script

Run the test script:

```bash
cd hydra-fe
node scripts/test-connection.js
```

### Manual Test

1. **Test Backend Health:**

   ```bash
   curl http://localhost:3002/api/health
   ```

2. **Test from Browser Console:**

   ```javascript
   fetch('http://localhost:3002/api/health')
     .then((r) => r.json())
     .then(console.log)
     .catch(console.error);
   ```

3. **Check Network Tab:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try to login
   - Check the failed request
   - Look at the error details

## Error Messages

### "Cannot connect to backend at http://localhost:3002"

- Backend is not running
- Wrong port number
- Firewall blocking connection

### "Backend connection failed: fetch failed"

- Network issue
- Backend crashed
- Port conflict

### CORS Error

- Backend CORS not configured for frontend URL
- Frontend URL doesn't match backend CORS origin

## Next Steps

1. ✅ Verify backend is running
2. ✅ Check environment variables
3. ✅ Test backend health endpoint
4. ✅ Check browser console for detailed errors
5. ✅ Review backend logs for errors

If the issue persists, check:

- Backend logs for startup errors
- Database connection status
- Port conflicts (another service using port 3002)
