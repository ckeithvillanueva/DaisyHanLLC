const Stripe = require("stripe");
const { createBookingEvent } = require("../lib/googleCalendar");

// Disable Vercel's automatic body parsing — Stripe needs the raw body to verify the signature
module.exports.config = { api: { bodyParser: false } };

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.Secret_Key_Test;
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY env var" });
  }
  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ error: "Missing STRIPE_WEBHOOK_SECRET env var" });
  }

  // Collect raw body from stream
  const rawBody = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });

  const sig = req.headers["stripe-signature"];
  const stripe = new Stripe(STRIPE_SECRET_KEY);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const { metadata } = event.data.object;

    try {
      await createBookingEvent({
        summary:     `Consulting Call with ${metadata.userName || "Client"}`,
        description: metadata.topic || `${metadata.session || "Consulting"} session with Daisy Han`,
        startTime:   metadata.startTime,
        endTime:     metadata.endTime,
        userEmail:   metadata.userEmail,
      });
    } catch (err) {
      // Log but don't fail the webhook — Stripe would retry if we return non-200
      console.error("Google Calendar error:", err.message);
    }
  }

  return res.status(200).json({ received: true });
};
