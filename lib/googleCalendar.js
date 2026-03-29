const { google } = require("googleapis");

function getAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!clientEmail || !privateKey) {
    throw new Error("Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY");
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

/**
 * Creates a calendar event and sends invites.
 * Env: GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, DAISY_EMAIL, optional GOOGLE_CALENDAR_ID
 */
async function createBookingEvent({ summary, startTime, endTime, userEmail, description }) {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });

  // Service accounts on personal Gmail cannot invite attendees without Domain-Wide Delegation.
  // Instead, include client details in the description so Daisy sees them on the event.
  const fullDescription = [
    description,
    userEmail ? `Client email: ${userEmail}` : "",
  ].filter(Boolean).join("\n");

  const event = {
    summary,
    description: fullDescription,
    start: { dateTime: startTime, timeZone: "Pacific/Honolulu" },
    end: { dateTime: endTime, timeZone: "Pacific/Honolulu" },
    conferenceData: {
      createRequest: { requestId: `booking-${Date.now()}` },
    },
  };

  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: "none",
  });

  return response.data;
}

module.exports = { createBookingEvent };
