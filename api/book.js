const { createBookingEvent, sendConfirmationEmail } = require("../lib/googleCalendar");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { session, minutes, email, userName, startTime, endTime, topic } = req.body || {};

  if (!email || !userName || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required fields: email, userName, startTime, endTime" });
  }

  try {
    const event = await createBookingEvent({
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
      meetLink: event.meetLink,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("Booking error:", err.message);
    return res.status(500).json({ error: err.message || "Booking failed" });
  }
};
