const { google } = require("googleapis");

const LOOK_AHEAD_DAYS = 60;

function getAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey  = process.env.GOOGLE_PRIVATE_KEY;
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
 * GET /api/availability
 *
 * Reads "Available" blocks on the Consulting LLC calendar.
 * Those windows define when booking is open.  Any other event
 * (e.g. "Consulting Call with …") that falls inside an Available window
 * is returned as a busySlot and shown as "Sold Out" in the UI.
 *
 * Daisy controls her schedule by adding/removing "Available" blocks
 * on the Consulting LLC calendar only.  Her main Gmail calendar stays
 * clean — only real booked appointments appear there.
 *
 * All times are UTC ISO strings.  The browser converts to the visitor's
 * local timezone — no timezone is ever hardcoded here.
 */
module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

  try {
    const auth     = getAuth();
    const calendar = google.calendar({ version: "v3", auth });
    const calId    = process.env.GOOGLE_CONSULTING_CALENDAR_ID || process.env.GOOGLE_CALENDAR_ID;

    if (!calId) throw new Error("Missing GOOGLE_CONSULTING_CALENDAR_ID in environment");

    const now     = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + LOOK_AHEAD_DAYS * 86_400_000).toISOString();

    const eventsRes = await calendar.events.list({
      calendarId:   calId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy:      "startTime",
    });

    const events = eventsRes.data.items || [];

    // "Available" blocks → define the bookable windows
    const availableBlocks = events
      .filter(e => (e.summary || "").toLowerCase().includes("available"))
      .map(e => ({
        start: new Date(e.start.dateTime || e.start.date).getTime(),
        end:   new Date(e.end.dateTime   || e.end.date).getTime(),
      }));

    // All other events within Available windows → sold-out slots
    const bookingEvents = events
      .filter(e => !(e.summary || "").toLowerCase().includes("available"))
      .map(e => ({
        start: new Date(e.start.dateTime || e.start.date).getTime(),
        end:   new Date(e.end.dateTime   || e.end.date).getTime(),
      }));

    // Start from the next 15-minute boundary (small booking buffer)
    const windowStart = Math.ceil(now.getTime() / 900_000) * 900_000;
    const windowEnd   = new Date(timeMax).getTime();

    const freeSlots = [];
    const busySlots = [];

    for (const avail of availableBlocks) {
      const blockStart = Math.max(avail.start, windowStart);
      const blockEnd   = Math.min(avail.end, windowEnd);
      if (blockStart >= blockEnd) continue;

      // Bookings that overlap this Available block
      const overlapping = bookingEvents
        .filter(b => b.end > blockStart && b.start < blockEnd)
        .sort((a, b) => a.start - b.start);

      // Sold-out slots (clipped to the Available window)
      for (const b of overlapping) {
        busySlots.push({
          start: new Date(Math.max(b.start, blockStart)).toISOString(),
          end:   new Date(Math.min(b.end, blockEnd)).toISOString(),
        });
      }

      // Free intervals = Available block minus booking events
      let cursor = blockStart;
      for (const { start: bs, end: be } of overlapping) {
        if (be <= cursor) continue;
        if (bs > cursor) {
          freeSlots.push({
            start: new Date(cursor).toISOString(),
            end:   new Date(bs).toISOString(),
          });
        }
        cursor = Math.max(cursor, be);
      }
      if (cursor < blockEnd) {
        freeSlots.push({
          start: new Date(cursor).toISOString(),
          end:   new Date(blockEnd).toISOString(),
        });
      }
    }

    return res.json({ freeSlots, busySlots });
  } catch (err) {
    console.error("Availability fetch error:", err.message);
    return res.json({ freeSlots: [], busySlots: [], error: err.message });
  }
};
