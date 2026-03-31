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
 * Queries the Google Calendar FreeBusy API and returns every free interval
 * in the next 60 days.  No timezone, no hardcoded working hours — Daisy
 * controls her bookable time entirely through her own calendar:
 *
 *   • Any event on her calendar (personal, work, blocked time) = unavailable.
 *   • Any gap between events = available for booking.
 *   • To prevent late-night or weekend bookings she adds a recurring
 *     "Not Available" block (e.g. 6 PM – 9 AM daily) — one-time setup.
 *
 * All times are UTC ISO strings.  The browser converts them to the
 * visitor's local timezone — no timezone is ever hardcoded here.
 */
module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

  try {
    const auth     = getAuth();
    const calendar = google.calendar({ version: "v3", auth });
    const calId    = process.env.GOOGLE_CALENDAR_ID || "primary";

    const now     = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + LOOK_AHEAD_DAYS * 86_400_000).toISOString();

    // Query FreeBusy — no timeZone field; ISO strings are self-describing.
    const fbRes = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: calId }],
      },
    });

    const calData = fbRes.data.calendars?.[calId];

    // Log any calendar-level errors (e.g. service account can't access the calendar)
    if (calData?.errors?.length) {
      console.error("FreeBusy calendar errors:", JSON.stringify(calData.errors));
    }

    const busyPeriods = (calData?.busy ?? [])
      .map((b) => ({
        start: new Date(b.start).getTime(),
        end:   new Date(b.end).getTime(),
      }))
      .sort((a, b) => a.start - b.start);

    // ── Compute free intervals ────────────────────────────────────
    // Start from the next clean 15-minute boundary so the first offered
    // slot is never "right now" (gives a small booking buffer).
    const windowStart = Math.ceil(now.getTime() / 900_000) * 900_000;
    const windowEnd   = new Date(timeMax).getTime();

    const freeSlots = [];
    let cursor = windowStart;

    for (const { start: bs, end: be } of busyPeriods) {
      if (be <= cursor) continue;  // busy period already behind cursor
      if (bs >= windowEnd) break;  // busy period beyond our window

      if (bs > cursor) {
        freeSlots.push({
          start: new Date(cursor).toISOString(),
          end:   new Date(bs).toISOString(),
        });
      }
      cursor = Math.max(cursor, be);
    }

    if (cursor < windowEnd) {
      freeSlots.push({
        start: new Date(cursor).toISOString(),
        end:   new Date(windowEnd).toISOString(),
      });
    }

    // busySlots are shown as "Sold Out" in the calendar UI
    const busySlots = busyPeriods
      .filter((b) => b.end > windowStart && b.start < windowEnd)
      .map((b) => ({
        start: new Date(Math.max(b.start, windowStart)).toISOString(),
        end:   new Date(Math.min(b.end, windowEnd)).toISOString(),
      }));

    return res.json({ freeSlots, busySlots });
  } catch (err) {
    console.error("Availability fetch error:", err.message);
    return res.json({ freeSlots: [], busySlots: [], error: err.message });
  }
};
