# Mercado Pago Webhook Setup Guide

## Overview
Your webhook is already implemented and secured with signature verification. This guide explains how to configure it in production.

## Webhook Endpoint
```
POST {YOUR_API_URL}/api/payments/webhook/mercadopago
```

**Example:**
- Development: `http://localhost:3002/api/payments/webhook/mercadopago`
- Production: `https://api.your-domain.com/api/payments/webhook/mercadopago`

## 🔧 Configuration Steps

### 1. Get Your Webhook Secret

1. Go to [Mercado Pago Dashboard](https://www.mercadopago.com.mx/developers/panel/app)
2. Select your application
3. Navigate to **Webhooks** section
4. Copy the **Webhook Secret** (it looks like: `0aea298a8c4b...`)
5. Add it to your backend `.env`:
   ```env
   MERCADOPAGO_WEBHOOK_SECRET=your_secret_here
   ```

### 2. Register Your Webhook URL

#### For Production:

1. Go to [Mercado Pago Webhooks Dashboard](https://www.mercadopago.com.mx/developers/panel/webhooks)
2. Click **"Create Webhook"**
3. Configure:
   - **URL**: `https://api.your-domain.com/api/payments/webhook/mercadopago`
   - **Events to subscribe**:
     - ✅ `payment` (payment updates)
     - ✅ `merchant_order` (order updates)
   - **Mode**: Production
4. Click **"Save"**

#### For Development (Using ngrok):

Mercado Pago doesn't send webhooks to localhost. Use ngrok to expose your local server:

```bash
# Install ngrok (if not installed)
# Download from: https://ngrok.com/download

# Start ngrok tunnel
ngrok http 3002

# Copy the forwarding URL (e.g., https://abc123.ngrok.io)
# Register in MP Dashboard: https://abc123.ngrok.io/api/payments/webhook/mercadopago
```

### 3. Verify Environment Variables

Your backend `.env` should have:
```env
MERCADOPAGO_ACCESS_TOKEN=TEST-xxx... # or PROD-xxx for production
MERCADOPAGO_WEBHOOK_SECRET=0aea298a... # From MP Dashboard
API_URL=http://localhost:3002 # Or your production URL
FRONTEND_URL=http://localhost:3000 # Or your production URL
```

## 🧪 Testing

### Option 1: Use the Test Script (Local)

```bash
cd hydra-be
node test-webhook.js
```

This simulates a Mercado Pago webhook with proper signature.

### Option 2: Test with Real Payments

1. Create a test order with Mercado Pago payment method
2. Complete the payment using [Mercado Pago test cards](https://www.mercadopago.com.mx/developers/en/docs/checkout-pro/additional-content/test-cards)
3. Check your backend logs for webhook processing

**Test Cards:**
- **Approved**: 5031 7557 3453 0604, CVV: 123, Expiry: 11/25
- **Rejected**: 5031 4332 1540 6351
- **Pending**: 5031 4332 1540 6351 (with CPF ending in 001-099)

### Option 3: Use Mercado Pago Test Tool

1. Go to [MP Webhooks Dashboard](https://www.mercadopago.com.mx/developers/panel/webhooks)
2. Click on your webhook
3. Click **"Send test notification"**

## 🔍 Monitoring

### Check Webhook Logs

Backend logs will show:
```
[PaymentsController] Received Mercado Pago webhook: test-12345
[PaymentsController] Webhook signature verified for request test-12345
[PaymentsService] Processing Mercado Pago webhook
[PaymentsService] Verified payment 1234567890 with Mercado Pago. Status: approved
```

### Common Issues

#### ❌ "Invalid webhook signature"
- **Cause**: Secret mismatch or signature calculation error
- **Fix**: Verify `MERCADOPAGO_WEBHOOK_SECRET` matches MP Dashboard

#### ❌ "Payment not found in database"
- **Cause**: Webhook received before payment record created
- **Fix**: This is normal for test notifications. Real payments will exist.

#### ❌ "Could not verify payment status with provider"
- **Cause**: Invalid access token or payment ID
- **Fix**: Check `MERCADOPAGO_ACCESS_TOKEN` is correct

## 📊 Webhook Flow

```
1. User completes payment on Mercado Pago
   ↓
2. MP sends webhook to your endpoint
   ↓
3. Your backend verifies signature
   ↓
4. Backend queries MP API to verify payment
   ↓
5. Backend updates order status (PENDING → PAID)
   ↓
6. User receives confirmation email (if implemented)
```

## 🔐 Security Features

✅ **Signature Verification**: Every webhook is verified using HMAC SHA256  
✅ **Payment Verification**: Backend queries MP API to confirm payment status  
✅ **Idempotency**: Duplicate webhooks are handled gracefully  
✅ **Request ID Tracking**: All webhooks logged with unique ID  

## 📝 Webhook Events

Your backend handles these events:

| Event | Action | Status Update |
|-------|--------|---------------|
| `payment.created` | Payment initiated | N/A |
| `payment.updated` | Payment status changed | Check status |
| `approved` | Payment successful | Order → PAID |
| `rejected` | Payment failed | Order → CANCELLED |
| `pending` | Awaiting payment | Order → PENDING |
| `refunded` | Payment refunded | Order → REFUNDED |

## 🚀 Production Checklist

Before going live:

- [ ] Replace TEST token with PROD token
- [ ] Update `MERCADOPAGO_ACCESS_TOKEN` in production env
- [ ] Update `MERCADOPAGO_WEBHOOK_SECRET` in production env
- [ ] Register production webhook URL in MP Dashboard
- [ ] Test with real payment
- [ ] Monitor logs for 24 hours after launch
- [ ] Set up error alerting (optional)

## 📚 Resources

- [Mercado Pago Webhooks Docs](https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks)
- [Webhook Signature Guide](https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks#signature)
- [Test Cards](https://www.mercadopago.com.mx/developers/en/docs/checkout-pro/additional-content/test-cards)
