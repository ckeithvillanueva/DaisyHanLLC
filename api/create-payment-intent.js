const Stripe = require("stripe");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.Secret_Key_Test;
  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Server missing STRIPE_SECRET_KEY (or Secret_Key_Test) env var" });
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const { session, minutes, amount, email, userName, startTime, endTime, topic } = req.body || {};
    const amountCents = Number(amount);

    if (!Number.isFinite(amountCents) || !Number.isInteger(amountCents) || amountCents < 50) {
      return res.status(400).json({ error: "Invalid amount. Expected integer cents (>= 50)." });
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
};
