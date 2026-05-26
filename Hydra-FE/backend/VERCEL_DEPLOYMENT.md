# 🚀 Vercel Production Deployment - Mercado Pago Configuration

## ❌ Current Error

You're seeing:
```json
{
  "message": "Failed to create Mercado Pago preference: back_urls invalid. Wrong format",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Root Cause**: The `FRONTEND_URL` environment variable is not configured correctly in your Vercel deployment.

---

## ✅ Solution: Configure Vercel Environment Variables

### Step 1: Set Environment Variables in Vercel

Go to your Vercel dashboard:

1. **Navigate to**: https://vercel.com/dashboard
2. **Select** your `hydra-be` project
3. **Go to**: Settings → Environment Variables

### Step 2: Add Required Variables

Add these environment variables:

#### **FRONTEND_URL** (Critical for Mercado Pago)
```
Variable Name: FRONTEND_URL
Value: https://your-frontend-domain.vercel.app
Environment: Production, Preview, Development
```

**Important**:
- ✅ Use your **actual frontend Vercel URL**
- ✅ Must include `https://`
- ✅ Must be a **single URL** (no commas)
- ✅ No trailing slash
- ❌ Don't use `localhost` in production

**Example**:
```
https://hydra-fe.vercel.app
```

#### **MERCADOPAGO_ACCESS_TOKEN** (Production Token)
```
Variable Name: MERCADOPAGO_ACCESS_TOKEN
Value: PROD-6816494707380258-112821-xxxxx (your production token)
Environment: Production
```

**For Production**: Get from [Mercado Pago Dashboard → Credentials](https://www.mercadopago.com.mx/developers/panel/app)

**For Testing on Vercel**: You can use TEST token temporarily:
```
TEST-6816494707380258-112821-11a4978195b0c4ee867693bde939c782-398786505
```

#### **MERCADOPAGO_WEBHOOK_SECRET**
```
Variable Name: MERCADOPAGO_WEBHOOK_SECRET
Value: 0aea298a8c4b65f5dbed36cc07885b2c5c82d8458af7bfc973f90ba551d2e599
Environment: Production, Preview, Development
```

Get this from: [Mercado Pago Dashboard → Webhooks](https://www.mercadopago.com.mx/developers/panel/webhooks)

### Step 3: Other Required Environment Variables

Make sure these are also set:

```env
DATABASE_URL=postgresql://postgres.xxx:xxx@aws-1-us-east-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.xxx:xxx@aws-1-us-east-1.pooler.supabase.com:5432/postgres
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
SUPABASE_URL=https://gxkxkjnehvhhxpjrxuhq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3002
```

---

## 📋 Complete Environment Variables Checklist

Copy this to your Vercel settings:

| Variable | Value (Example) | Required For |
|----------|-----------------|--------------|
| `FRONTEND_URL` | `https://hydra-fe.vercel.app` | ✅ Mercado Pago redirects |
| `MERCADOPAGO_ACCESS_TOKEN` | `PROD-xxx` or `TEST-xxx` | ✅ MP API calls |
| `MERCADOPAGO_WEBHOOK_SECRET` | `0aea298a...` | ✅ Webhook security |
| `DATABASE_URL` | `postgresql://...` | ✅ Database |
| `DIRECT_URL` | `postgresql://...` | ✅ Prisma migrations |
| `JWT_SECRET` | `your-secret` | ✅ Authentication |
| `JWT_EXPIRES_IN` | `7d` | ✅ Auth tokens |
| `SUPABASE_URL` | `https://...supabase.co` | ✅ Supabase |
| `SUPABASE_ANON_KEY` | `eyJhbGc...` | ✅ Supabase |
| `PORT` | `3002` | Optional |

---

## 🔧 Step 4: Redeploy

After adding environment variables:

### Option A: Automatic Redeploy
1. Vercel will show a banner asking to redeploy
2. Click **"Redeploy"**

### Option B: Manual Redeploy
1. Go to **Deployments** tab
2. Click the **three dots** (•••) on the latest deployment
3. Click **"Redeploy"**

### Option C: Push New Commit
```bash
git commit --allow-empty -m "trigger redeploy with env vars"
git push
```

---

## 🧪 Testing After Deployment

### 1. Check Environment Variable
Test if FRONTEND_URL is set correctly:

```bash
# Add a test endpoint to your backend (optional)
GET https://hydra-be.vercel.app/api/config/frontend-url

# Or check the logs when creating an order
# Look for: "Using validated Base URL for MP Preference: https://..."
```

### 2. Test Order Creation

1. Go to your frontend: `https://your-fe.vercel.app`
2. Add products to cart
3. Go to checkout
4. Select Mercado Pago
5. Click "Pagar"

**Expected**:
- ✅ Redirect to Mercado Pago checkout
- ❌ If error: Check Vercel function logs

### 3. Check Vercel Logs

View logs in real-time:
1. Go to **Vercel Dashboard → Your Project**
2. Click **"Functions"** tab
3. Find the `/api/orders/checkout` function
4. Click to view logs

Look for:
```
✅ "Using validated Base URL for MP Preference: https://hydra-fe.vercel.app"
❌ "Invalid FRONTEND_URL: ..."
```

---

## 🐛 Troubleshooting

### Error: "back_urls invalid. Wrong format"

**Possible Causes**:

1. **FRONTEND_URL not set**
   ```
   Solution: Add FRONTEND_URL in Vercel settings
   ```

2. **FRONTEND_URL missing protocol**
   ```
   Wrong: hydra-fe.vercel.app
   Right: https://hydra-fe.vercel.app
   ```

3. **FRONTEND_URL has multiple URLs**
   ```
   Wrong: https://domain1.com,https://domain2.com
   Right: https://domain1.com
   ```

4. **FRONTEND_URL has trailing slash**
   ```
   Wrong: https://hydra-fe.vercel.app/
   Right: https://hydra-fe.vercel.app
   ```

### How to Check Current FRONTEND_URL:

Add this temporary endpoint to your backend:

```typescript
// src/app.controller.ts
@Get('config/frontend-url')
getFrontendUrl() {
  const url = this.configService.get<string>('FRONTEND_URL');
  return { 
    frontendUrl: url,
    parsed: url?.split(',')[0].trim(),
    isValid: url?.startsWith('http')
  };
}
```

Then visit: `https://hydra-be.vercel.app/api/config/frontend-url`

---

## 🔐 Webhook Setup for Production

After fixing the order creation, configure webhooks:

### 1. Register Webhook URL

1. Go to: https://www.mercadopago.com.mx/developers/panel/webhooks
2. Click **"Create Webhook"**
3. Configure:
   - **URL**: `https://hydra-be.vercel.app/api/payments/webhook/mercadopago`
   - **Events**: `payment`, `merchant_order`
   - **Mode**: Production (or Test for testing)

### 2. Copy Webhook Secret

1. After creating, copy the **Webhook Secret**
2. Add to Vercel env vars as `MERCADOPAGO_WEBHOOK_SECRET`

---

## 📊 Deployment Checklist

Before going live:

### Environment Variables
- [ ] `FRONTEND_URL` set to production domain
- [ ] `MERCADOPAGO_ACCESS_TOKEN` using PROD token
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` configured
- [ ] `DATABASE_URL` pointing to production DB
- [ ] `JWT_SECRET` is strong and unique
- [ ] All Supabase vars configured

### Mercado Pago
- [ ] Production credentials activated
- [ ] Webhook registered in MP Dashboard
- [ ] Test transaction completed successfully
- [ ] back_urls redirecting correctly

### Security
- [ ] Webhook signature verification enabled
- [ ] JWT secret rotated from test value
- [ ] Database credentials secured
- [ ] CORS configured for production domains

---

## 🎯 Quick Fix Summary

**To fix your current error**:

1. **Go to Vercel** → hydra-be → Settings → Environment Variables
2. **Add**:
   ```
   FRONTEND_URL = https://your-actual-frontend.vercel.app
   ```
3. **Make sure**: No trailing slash, single URL only, includes `https://`
4. **Click** "Redeploy" when Vercel prompts
5. **Test** checkout again

---

## 📞 Need Help?

If the error persists:

1. **Check Vercel Logs**: Look for the log message about FRONTEND_URL
2. **Verify Variables**: Use the test endpoint suggested above
3. **Test Locally**: Make sure it works on localhost first
4. **Check Mercado Pago Logs**: View transaction attempts in MP Dashboard

---

*Last Updated: 2026-02-14*
