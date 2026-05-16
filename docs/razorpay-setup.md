# Razorpay integration

## Overview

- **Server** creates Razorpay **Orders** (amount in paise) using your API key **secret** (never exposed to the browser).
- **Checkout** runs in the browser with the **key id** (publishable) and `order_id`.
- After payment, the **signature** is verified on the server, the payment is fetched from Razorpay to confirm amount/status, then a normal **Payment** row is stored with method `ONLINE`.

## Backend configuration (`application.yml` or env)

```yaml
app:
  razorpay:
    enabled: true
    key-id: rzp_test_xxxxxxxx
    key-secret: xxxxxxxxxxxxxxxx
```

Or via environment variables (recommended for production):

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Restart the API after changes.

## Frontend

- **Record payment** shows **Pay with Razorpay** only when `GET /api/v1/payments/razorpay/config` returns `enabled: true` (and you are not using `useMockApi`).
- **Subscriptions → Sell membership**: if **Method** is **UPI (Razorpay)** and you click **Complete sale**, Razorpay Checkout opens (same server flow as record payment). **Cash** and **Card** still use the offline completion stub until a subscription API exists.
- No Razorpay secrets in Angular — only the publishable key is returned by the API for Checkout.

## Testing

1. Use [Razorpay Test Mode](https://razorpay.com/docs/payments/payment-gateway/test-mode/) keys.
2. Complete a payment with [test cards / UPI](https://razorpay.com/docs/payments/payments/test-card-details/).
3. Confirm the payment appears under **Billing → Payments** with method **ONLINE** and notes including Razorpay ids.

## Security notes

- Never commit real `key-secret` values.
- Prefer webhooks for high-volume production reconciliation (optional follow-up).
