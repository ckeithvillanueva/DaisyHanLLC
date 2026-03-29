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
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
}

/**
 * Reads the Daisy Han Consulting calendar and returns bookable time ranges.
 *
 * How it works:
 *   - Events whose title starts with "Available" (case-insensitive) define open windows.
 *   - All other timed events are treated as conflicts and subtracted from those windows.
 *   - No hardcoded working hours or timezones — Daisy controls availability entirely
 *     from Google Calendar by adding/removing "Available" events.
 *
 * Returns: { freeSlots: [{ start: ISO string, end: ISO string }, ...] }
 *
 * Times are UTC ISO strings; the browser converts them to the visitor's local timezone.
 */
module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

  try {
    const auth = getAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const eventsRes = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
    });

    const items = eventsRes.data.items || [];
    const availableWindows = []; // open windows from "Available" events
    const busyIntervals = [];   // conflicts from all other timed events

    for (const event of items) {
      const summary = (event.summary || "").toLowerCase().trim();
      const isAvailable = summary.startsWith("available");

      // Only process timed events (skip all-day events)
      if (event.start?.dateTime && event.end?.dateTime) {
        const startMs = new Date(event.start.dateTime).getTime();
        const endMs   = new Date(event.end.dateTime).getTime();
        if (isAvailable) {
          availableWindows.push([startMs, endMs]);
        } else {
          busyIntervals.push([startMs, endMs]);
        }
      }
    }

    availableWindows.sort((a, b) => a[0] - b[0]);
    busyIntervals.sort((a, b) => a[0] - b[0]);

    // For each available window, subtract busy intervals → free slots
    const freeSlots = [];
    for (const [winStart, winEnd] of availableWindows) {
      let cursor = winStart;
      for (const [bs, be] of busyIntervals) {
        if (be <= cursor) continue; // entirely before cursor
        if (bs >= winEnd) break;   // entirely after window
        if (bs > cursor) {
          freeSlots.push({
            start: new Date(cursor).toISOString(),
            end:   new Date(bs).toISOString(),
          });
        }
        cursor = Math.max(cursor, be);
      }
      if (cursor < winEnd) {
        freeSlots.push({
          start: new Date(cursor).toISOString(),
          end:   new Date(winEnd).toISOString(),
        });
      }
    }

    return res.json({ freeSlots });
  } catch (err) {
    console.error("Availability fetch error:", err.message);
    return res.json({ freeSlots: [], error: err.message });
  }
};
