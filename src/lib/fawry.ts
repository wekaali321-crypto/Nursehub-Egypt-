/**
 * Fawry Payment Integration for NurseHub Egypt.
 *
 * Fawry allows customers to pay via:
 *  - Fawry machines/retail locations
 *  - FawryPay mobile app
 *  - Online card payment (via FawryPay)
 *
 * Official Docs: https://developer.fawrystaging.com/
 */

const BASE_URL = "https://atfawry.fawrystaging.com";

interface FawryConfig {
  merchantCode: string;
  securityKey: string;
  merchantRefNumber: string;
}

interface FawryOrderPayload {
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  customerProfileId?: string;
  chargeItems: {
    itemId: string;
    description: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
}

/**
 * Create a Fawry payment charge.
 * In production, call this from your server/Edge Function to protect
 * your security key.
 */
export async function createFawryCharge(
  config: FawryConfig,
  payload: FawryOrderPayload
): Promise<{ fawryRefNumber: string; paymentUrl: string }> {
  const body = {
    merchantCode: config.merchantCode,
    merchantRefNum: config.merchantRefNumber,
    customerName: payload.customerName,
    customerMobile: payload.customerMobile,
    customerEmail: payload.customerEmail,
    customerProfileId: payload.customerProfileId || `cust-${Date.now()}`,
    chargeItems: payload.chargeItems,
    chargeAmount: payload.totalAmount,
    currencyCode: "EGP",
    paymentMethod: "PAYATFAWRY",
    returnUrl: window.location.origin + "/checkout/success",
    description: "NurseHub Egypt Purchase",
  };

  const res = await fetch(`${BASE_URL}/ECommerceWeb/Fawry/payments/attendant/v2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.fawryRefNumber) {
    throw new Error(data.message || "Fawry charge creation failed");
  }

  return {
    fawryRefNumber: data.fawryRefNumber,
    paymentUrl: `${BASE_URL}/pay?referenceNumber=${data.fawryRefNumber}`,
  };
}

/**
 * Check the status of a Fawry payment.
 */
export async function checkFawryPayment(
  config: FawryConfig,
  fawryRefNumber: string
): Promise<{ status: string; paidAmount: number }> {
  const res = await fetch(
    `${BASE_URL}/ECommerceWeb/Fawry/payments/status/v2?merchantCode=${config.merchantCode}&fawryRefNumber=${fawryRefNumber}`,
    { method: "GET" }
  );

  const data = await res.json();
  return {
    status: data.paymentStatus || "unknown",
    paidAmount: data.paidAmount || 0,
  };
}
