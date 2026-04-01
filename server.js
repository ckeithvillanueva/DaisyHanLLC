const path = require("path");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

const { createBookingEvent, sendConfirmationEmail } = require("./lib/googleCalendar");
const availabilityHandler = require("./api/availability");

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/book", async (req, res) => {
  const { session, minutes, email, userName, startTime, endTime, topic } = req.body || {};

  if (!email || !userName || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required fields: email, userName, startTime, endTime" });
  }

  try {
    await createBookingEvent({
      summary:     `Consulting Call with ${userName}`,
      description: `${topic || session || "Consulting"} session with Daisy Han`,
      startTime,
      endTime,
      userEmail:   email,
    });

    await sendConfirmationEmail({
      userEmail: email,
      userName,
      startTime,
      endTime,
      topic,
      session,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("Booking error:", err.message);
    return res.status(500).json({ error: err.message || "Booking failed" });
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
