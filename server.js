const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const Stripe = require("stripe");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
const { createBookingEvent, sendConfirmationEmail } = require("./lib/googleCalendar");
const availabilityHandler = require("./api/availability");

// Webhook must be registered BEFORE express.json() — needs raw body for signature verification
app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers["stripe-signature"];

  if (!STRIPE_SECRET_KEY) return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
  if (!WEBHOOK_SECRET)    return res.status(500).json({ error: "Missing STRIPE_WEBHOOK_SECRET" });

  let event;
  try {
    event = new Stripe(STRIPE_SECRET_KEY).webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const { metadata } = event.data.object;
    try {
      await createBookingEvent({
        summary:     `Consulting Call with ${metadata.userName || "Client"}`,
        description: `${metadata.topic || metadata.session || "Consulting"} session with Daisy Han`,
        startTime:   metadata.startTime,
        endTime:     metadata.endTime,
        userEmail:   metadata.userEmail,
      });
      console.log("Calendar event created for", metadata.userName);

      // Send branded confirmation email + the calendar event above sends
      // the Google Meet invite via sendUpdates:'all'.
      await sendConfirmationEmail({
        userEmail: metadata.userEmail,
        userName:  metadata.userName,
        startTime: metadata.startTime,
        endTime:   metadata.endTime,
        topic:     metadata.topic,
        session:   metadata.session,
      });
    } catch (err) {
      console.error("Post-payment processing error:", err.message);
    }
  }

  return res.status(200).json({ received: true });
});

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

    const { session, minutes, amount, email, userName, startTime, endTime, topic } = req.body || {};
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
        session:   String(session || ""),
        minutes:   String(minutes || ""),
        userName:  String(userName || ""),
        userEmail: String(email || ""),
        startTime: String(startTime || ""),
        endTime:   String(endTime || ""),
        topic:     String(topic || ""),
      },
    });

    return res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    return res.status(500).json({
      error: err && err.message ? err.message : "Stripe payment intent creation failed",
    });
  }
});

app.get("/api/availability", availabilityHandler);

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
