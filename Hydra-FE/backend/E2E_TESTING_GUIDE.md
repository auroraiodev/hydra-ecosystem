# 🧪 Manual E2E Testing Guide - Mercado Pago Integration

## Prerequisites Checklist

Before starting, ensure:
- ✅ Backend running at `http://localhost:3002`
- ✅ Frontend running at `http://localhost:3000`
- ✅ You have a test user account
- ✅ You have products in the database
- ✅ Mercado Pago test credentials configured in `.env`

---

## Test Flow Overview

```
User Login → Browse Products → Add to Cart → Checkout → 
Select Mercado Pago → Complete Payment → Verify Order Status
```

---

## Step-by-Step Test Instructions

### 1️⃣ **Login to Your Account**

1. Open `http://localhost:3000`
2. Click **Login**
3. Enter credentials:
   - Email: `<your-test-email>`
   - Password: `<your-test-password>`
4. ✅ **Verify**: You're redirected to the marketplace

---

### 2️⃣ **Add Products to Cart**

1. Browse products on the marketplace
2. Click **"Agregar al Carrito"** on any product
3. Add at least 1-2 products
4. Click the **Cart icon** (top right)
5. ✅ **Verify**: Products appear in cart with correct prices

**Screenshot checkpoint:**
- [ ] Cart shows correct item count
- [ ] Prices are displayed correctly
- [ ] Total is calculated properly

---

### 3️⃣ **Navigate to Checkout**

1. In the cart, click **"Proceder al Pago"** or **"Checkout"**
2. You should be on `/checkout`
3. ✅ **Verify**: Checkout page loads with 3 sections:
   - Section 1: Contact (Email, Phone)
   - Section 2: Shipping Method
   - Section 3: Payment Method

---

### 4️⃣ **Fill Out Checkout Form**

#### Contact Information:
- **Email**: Auto-filled (should show your user email)
- **Phone**: Enter `(55) 1234 5678` (test number)

#### Shipping Method:
Choose one:
- **Option A**: "Envío a domicilio" (requires address)
- **Option B**: "Acordar con vendedor" ✅ (easier for testing)

If choosing **Option A (Shipping)**:
1. Click **"Agregar nueva dirección"**
2. Fill in:
   - Nombre: `Test User`
   - Calle: `Av. Reforma 222, Depto 401`
   - Ciudad: `Ciudad de México`
   - Estado: `CDMX`
   - Código Postal: `06600`
3. Click **"Guardar Dirección"**

---

### 5️⃣ **Select Mercado Pago Payment Method**

1. In Section 3 (Payment), click **"Mercado Pago"** card
2. ✅ **Verify**: 
   - Mercado Pago is highlighted
   - You see Mercado Pago logo and description
   - Payment summary shows:
     - Subtotal
     - Shipping cost (if applicable)
     - Import fee (if applicable)
     - **Mercado Pago fee (3.5%)**
     - **Final Total**

**Expected Fees:**
```
Subtotal:           $100.00
Shipping:           $280.00 (if "Envío a domicilio")
Import Fee:         $40.00  (if Importation items)
MP Fee (3.5%):      $14.70  (3.5% of subtotal + shipping + import)
-----------------------------------
TOTAL:              $434.70
```

---

### 6️⃣ **Complete Order Creation**

1. Click the **"Pagar"** button at the bottom
2. ✅ **Verify**: Button shows loading state
3. **Expected behavior:**
   - Backend creates order
   - Backend creates Mercado Pago preference
   - You are **redirected** to Mercado Pago's checkout page

**What you should see:**
- ❌ If you see an error → Check browser console and backend logs
- ✅ If redirected to Mercado Pago → Success! Continue to next step

---

### 7️⃣ **Complete Payment on Mercado Pago**

You'll be on Mercado Pago's test checkout page.

#### Use Test Cards:

**For APPROVED payment:**
```
Card Number:    5031 7557 3453 0604
CVV:            123
Expiry:         11/25
Name:           APRO
CPF:            12345678909
```

**For REJECTED payment (optional test):**
```
Card Number:    5031 4332 1540 6351
CVV:            123
Expiry:         11/25
Name:           OTHE
```

**Steps:**
1. Select **"Tarjeta de crédito"** (Credit Card)
2. Enter the test card details
3. Click **"Pagar"**
4. ✅ **Verify**: Payment is processed
5. You're redirected back to your app

**Redirect URL will be:**
```
http://localhost:3000/orders/{ORDER_ID}?status=success
```

---

### 8️⃣ **Verify Order Status**

After redirect, you should see the order details page.

✅ **Check the following:**

1. **Order Information:**
   - [ ] Order ID is displayed
   - [ ] Order status shows: **"PENDING"** (initially)
   - [ ] Items are listed correctly
   - [ ] Total matches checkout amount

2. **Payment Information:**
   - [ ] Payment method: "Mercado Pago"
   - [ ] Payment status: **"approved"** or **"pending"**
   - [ ] Mercado Pago Payment ID is shown

3. **Backend Webhook Processing:**
   - Open backend logs
   - Look for:
   ```
   [PaymentsController] Received Mercado Pago webhook
   [PaymentsController] Webhook signature verified
   [PaymentsService] Processing Mercado Pago webhook
   [PaymentsService] Verified payment with Mercado Pago. Status: approved
   [OrdersService] Updating order to PAID status
   ```

4. **Final Order Status:**
   - Refresh the page
   - Order status should change to: **"PAID"**

---

### 9️⃣ **Test Webhook Manually** (Optional)

If the webhook wasn't triggered (localhost limitation):

```bash
cd hydra-be
node test-webhook.js
```

Then check order status again.

---

## 🎯 Success Criteria

| Check | Status |
|-------|--------|
| ✅ User can login | |
| ✅ Products can be added to cart | |
| ✅ Checkout page loads correctly | |
| ✅ Mercado Pago fee (3.5%) calculated | |
| ✅ Redirected to Mercado Pago | |
| ✅ Payment with test card works | |
| ✅ Redirected back to order page | |
| ✅ Order status updates to PAID | |
| ✅ Webhook logs show processing | |

---

## 🐛 Troubleshooting

### Issue: "Order creation failed"
**Check:**
- Backend logs for errors
- Database connection
- Cart has items
- User is authenticated

### Issue: "No redirect to Mercado Pago"
**Check:**
- `response.payment.initPoint` in network tab
- Backend logs for preference creation
- `MERCADOPAGO_ACCESS_TOKEN` in `.env`

### Issue: "Payment approved but order still PENDING"
**Reason:** Webhook not received (localhost limitation)
**Solution:**
1. Use `node test-webhook.js` to simulate
2. Or use ngrok for real webhook testing

### Issue: "Invalid webhook signature"
**Check:**
- `MERCADOPAGO_WEBHOOK_SECRET` matches MP Dashboard
- Logs show correct signature format

---

## 📊 Test Data

### Test Cards Reference
| Purpose | Card Number | CVV | Result |
|---------|-------------|-----|--------|
| Approved | 5031 7557 3453 0604 | 123 | ✅ Success |
| Rejected | 5031 4332 1540 6351 | 123 | ❌ Rejected |
| Pending | 5031 4332 1540 6351 | 123 | ⏳ Pending |

More test cards: https://www.mercadopago.com.mx/developers/en/docs/checkout-pro/additional-content/test-cards

---

## 📝 Test Results Log

Date: ______________
Tester: ______________

| Step | Result | Notes |
|------|--------|-------|
| Login | ⬜ Pass ⬜ Fail | |
| Add to Cart | ⬜ Pass ⬜ Fail | |
| Checkout Form | ⬜ Pass ⬜ Fail | |
| MP Redirect | ⬜ Pass ⬜ Fail | |
| Payment | ⬜ Pass ⬜ Fail | |
| Order Status | ⬜ Pass ⬜ Fail | |
| Webhook | ⬜ Pass ⬜ Fail | |

---

## 🚀 Ready for Production?

Before deploying:
- [ ] All E2E tests pass
- [ ] Webhook signature verification works
- [ ] Production credentials configured
- [ ] Webhook registered in MP Dashboard
- [ ] Error handling tested
- [ ] Refund flow tested
- [ ] Mobile responsive checked

---

**Happy Testing! 🎉**
