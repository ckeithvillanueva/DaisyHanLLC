const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const Stripe = require("stripe");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    stripeConfigured: Boolean(STRIPE_SECRET_KEY),
  });
});

app.post("/api/create-payment-intent", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        error: "Server missing STRIPE_SECRET_KEY in .env",
      });
    }

    const { session, minutes, amount, email } = req.body || {};
    const amountCents = Number(amount);

    if (!Number.isFinite(amountCents) || !Number.isInteger(amountCents) || amountCents < 50) {
      return res.status(400).json({
        error: "Invalid amount. Expected integer cents (>= 50).",
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: typeof email === "string" && email.trim() ? email.trim() : undefined,
      metadata: {
        session: String(session || ""),
        minutes: String(minutes || ""),
      },
    });

    return res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    return res.status(500).json({
      error: err && err.message ? err.message : "Stripe payment intent creation failed",
    });
  }
});

app.get("*", (req, res) => {
  // Keep this site single-file friendly with a fallback.
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API route not found" });
  }
  return res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Daisy site running at http://localhost:${PORT}`);
});
