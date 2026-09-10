import "server-only";
import Stripe from "stripe";
import { config } from "@/lib/app/config";
import { ApiError } from "@/lib/app/errors";
import { addDays, newId, nowIso } from "@/lib/app/hash";
import type { ProductId, Purchase } from "@/lib/app/types";
import { type CheckoutCurrency, type CountryCode, checkoutCurrencyFor } from "@/lib/app/markets";
import { PRODUCTS, priceFor } from "./plans";
import { addPurchase, claimWebhookEvent, findPurchaseByPaymentIntent, findPurchaseBySession, listPurchases, updatePurchase } from "@/lib/store/purchases";
import { planForPurchase } from "./entitlements";

/* ------------------------------------------------------------------
   Stripe Checkout, one-time payments only. No customer card is stored:
   sessions never request setup_future_usage and nothing renews.
------------------------------------------------------------------- */

let stripe: Stripe | null = null;

export function stripeClient(): Stripe | null {
  if (!config.stripe.secretKey) return null;
  if (!stripe) stripe = new Stripe(config.stripe.secretKey);
  return stripe;
}

export function billingMode(): "stripe" | "dev" | "off" {
  if (config.stripe.secretKey) return "stripe";
  if (config.stripe.devCheckout) return "dev";
  return "off";
}

export async function createCheckout(input: { uid: string; email: string; product: ProductId; origin: string; country?: CountryCode }): Promise<{ url: string; mode: "stripe" | "dev" }> {
  const product = PRODUCTS[input.product];
  const currency = checkoutCurrencyFor(input.country);
  const amount = priceFor(input.product, currency);
  const mode = billingMode();

  if (mode === "dev") {
    const purchase = await grantPurchase({ uid: input.uid, product: input.product, source: "dev", amountCents: amount, currency });
    return { url: `${input.origin}/checkout/success?dev=1&purchase=${purchase.id}`, mode: "dev" };
  }
  if (mode === "off") throw new ApiError(503, "billing_unavailable", "Payments are not configured yet. Email us and we will set you up by hand.");

  const s = stripeClient()!;
  const session = await s.checkout.sessions.create({
    mode: "payment",
    customer_email: input.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amount,
          product_data: { name: `Orvenic ${product.name}`, description: product.description },
        },
      },
    ],
    metadata: { uid: input.uid, product: input.product },
    payment_intent_data: { metadata: { uid: input.uid, product: input.product } },
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    automatic_tax: { enabled: config.stripe.automaticTax },
    success_url: `${input.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/checkout/cancelled?plan=${input.product}`,
  });
  if (!session.url) throw new ApiError(502, "stripe_no_url", "Stripe did not return a checkout URL.");
  return { url: session.url, mode: "stripe" };
}

/** Create the purchase record for a paid product. Idempotent on Stripe session id. */
export async function grantPurchase(input: { uid: string; product: ProductId; source: Purchase["source"]; amountCents: number; currency: CheckoutCurrency; stripeSessionId?: string; stripePaymentIntentId?: string }): Promise<Purchase> {
  if (input.stripeSessionId) {
    const existing = await findPurchaseBySession(input.stripeSessionId);
    if (existing) return existing;
  }
  const product = PRODUCTS[input.product];
  const now = nowIso();
  let startsAt = now;

  // Extra 30 days queues after the current pass instead of overlapping it.
  if (input.product === "extra30") {
    const live = (await listPurchases(input.uid)).filter((p) => p.status === "active" && planForPurchase(p) === "pass" && p.endsAt && new Date(p.endsAt).getTime() > Date.now());
    live.sort((a, b) => (a.endsAt! < b.endsAt! ? 1 : -1));
    if (live[0]?.endsAt) startsAt = live[0].endsAt;
  }

  const purchase: Purchase = {
    id: newId(),
    uid: input.uid,
    product: input.product,
    status: "active",
    amountCents: input.amountCents,
    currency: input.currency,
    createdAt: now,
    startsAt,
    endsAt: product.periodDays ? addDays(startsAt, product.periodDays) : undefined,
    used: 0,
    source: input.source,
    stripeSessionId: input.stripeSessionId,
    stripePaymentIntentId: input.stripePaymentIntentId,
  };
  await addPurchase(purchase);
  return purchase;
}

export async function grantFromSession(session: Stripe.Checkout.Session): Promise<Purchase | null> {
  if (session.payment_status !== "paid") return null;
  const uid = session.metadata?.uid;
  const product = session.metadata?.product as ProductId | undefined;
  if (!uid || !product || !(product in PRODUCTS)) return null;
  const currency: CheckoutCurrency = session.currency === "usd" ? "usd" : "cad";
  return grantPurchase({
    uid,
    product,
    source: "stripe",
    amountCents: session.amount_total ?? priceFor(product, currency),
    currency,
    stripeSessionId: session.id,
    stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
  });
}

/** Called from the success page so access is granted even if the webhook is late. */
export async function confirmSession(sessionId: string, uid: string): Promise<Purchase | null> {
  const s = stripeClient();
  if (!s) throw new ApiError(503, "billing_unavailable", "Payments are not configured.");
  const session = await s.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.uid !== uid) throw new ApiError(403, "forbidden", "That checkout belongs to a different account.");
  return grantFromSession(session);
}

export async function handleWebhook(rawBody: string, signature: string): Promise<{ handled: string }> {
  const s = stripeClient();
  if (!s || !config.stripe.webhookSecret) throw new ApiError(503, "billing_unavailable", "Webhook secret not configured.");
  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
  } catch {
    throw new ApiError(400, "bad_signature", "Invalid Stripe signature.");
  }
  const fresh = await claimWebhookEvent(event.id);
  if (!fresh) return { handled: "duplicate" };

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      await grantFromSession(event.data.object);
      return { handled: event.type };
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (pi) {
        const purchase = await findPurchaseByPaymentIntent(pi);
        if (purchase) await updatePurchase(purchase.id, { status: "refunded", refundedAt: nowIso() });
      }
      return { handled: event.type };
    }
    default:
      return { handled: "ignored" };
  }
}
