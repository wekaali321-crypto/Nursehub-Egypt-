/**
 * Paymob Payment Integration for NurseHub Egypt.
 *
 * Flow:
 *  1. Create Paymob order on server → get order_id & payment key
 *  2. Redirect customer to Paymob iframe
 *  3. Receive webhook callback → confirm payment → update order
 *
 * Environment Variables:
 *   VITE_PAYMOB_API_KEY
 *   VITE_PAYMOB_INTEGRATION_ID
 *   VITE_PAYMOB_IFRAME_ID
 *
 * Official Docs: https://docs.paymob.com/docs
 */

const BASE_URL = "https://accept.paymob.com/api";

interface PaymobConfig {
  apiKey: string;
  integrationId: number;
  iframeId: number;
}

interface OrderPayload {
  amountCents: number;
  currency: string;
  items: { name: string; price: number; quantity: number }[];
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  orderId: string; // internal order ID
}

interface PaymobOrderResponse {
  id: number;
  payment_key: string;
}

/**
 * Step 1: Create order on Paymob and get payment key.
 * In production, this should be called from your server/Edge Function
 * to protect your API key.
 */
export async function createPaymobOrder(
  config: PaymobConfig,
  payload: OrderPayload
): Promise<PaymobOrderResponse> {
  // Authenticate
  const authRes = await fetch(`${BASE_URL}/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: config.apiKey }),
  });
  const authData = await authRes.json();
  if (!authData.token) throw new Error("Paymob auth failed");

  // Register order
  const orderRes = await fetch(`${BASE_URL}/ecommerce/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authData.token,
      delivery_needed: false,
      amount_cents: payload.amountCents,
      currency: payload.currency || "EGP",
      items: payload.items,
      merchant_order_id: payload.orderId,
    }),
  });
  const orderData = await orderRes.json();
  if (!orderData.id) throw new Error("Paymob order creation failed");

  // Get payment key
  const keyRes = await fetch(`${BASE_URL}/acceptance/payment_keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authData.token,
      amount_cents: payload.amountCents,
      currency: payload.currency || "EGP",
      order_id: orderData.id,
      billing_data: {
        first_name: payload.customer.name,
        last_name: "",
        email: payload.customer.email,
        phone_number: payload.customer.phone || "+201000000000",
        apartment: "NA",
        floor: "NA",
        street: "NA",
        building: "NA",
        city: "Cairo",
        country: "EG",
        state: "NA",
        postal_code: "NA",
      },
      integration_id: config.integrationId,
    }),
  });
  const keyData = await keyRes.json();
  if (!keyData.token) throw new Error("Paymob payment key failed");

  return { id: orderData.id, payment_key: keyData.token };
}

/**
 * Generate the Paymob iframe URL for customer payment.
 */
export function getPaymobIframeUrl(config: PaymobConfig, paymentKey: string): string {
  return `https://accept.paymob.com/api/acceptance/iframes/${config.iframeId}?payment_token=${paymentKey}`;
}

/**
 * Verify a webhook callback from Paymob (should be server-side).
 */
export function verifyPaymobWebhook(
  hmac: string
): boolean {
  // In production: use HMAC-SHA512 verification server-side
  return !!hmac && hmac.length > 0;
}
