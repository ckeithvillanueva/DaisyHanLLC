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
 * 1. Reads "Available" blocks from the Consulting LLC calendar — these
 *    define the outer bounds of bookable time.
 * 2. Any non-"Available" event on the Consulting calendar (an existing
 *    booking) inside an Available window → shown as "Sold Out".
 * 3. Also queries the main Gmail calendar for free/busy — personal events
 *    (massage, coaching, etc.) block the slot without leaking event details.
 *
 * A slot is only offered to clients if it's inside an Available block AND
 * free on both calendars.
 *
 * All times are UTC ISO strings; the browser converts to local timezone.
 */
module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

  try {
    const auth     = getAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const consultingCalId = process.env.GOOGLE_CONSULTING_CALENDAR_ID || process.env.GOOGLE_CALENDAR_ID;
    const mainCalId       = process.env.GOOGLE_MAIN_CALENDAR_ID;

    if (!consultingCalId) throw new Error("Missing GOOGLE_CONSULTING_CALENDAR_ID in environment");

    const now     = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + LOOK_AHEAD_DAYS * 86_400_000).toISOString();

    // ── 1. Consulting calendar events ─────────────────────────────
    const eventsRes = await calendar.events.list({
      calendarId:   consultingCalId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy:      "startTime",
    });

    const events = eventsRes.data.items || [];

    // "Available" blocks define the bookable windows
    const availableBlocks = events
      .filter(e => (e.summary || "").toLowerCase().includes("available"))
      .map(e => ({
        start: new Date(e.start.dateTime || e.start.date).getTime(),
        end:   new Date(e.end.dateTime   || e.end.date).getTime(),
      }));

    // Existing bookings on the Consulting calendar → "Sold Out" in the UI
    const consultingBusy = events
      .filter(e => !(e.summary || "").toLowerCase().includes("available"))
      .map(e => ({
        start: new Date(e.start.dateTime || e.start.date).getTime(),
        end:   new Date(e.end.dateTime   || e.end.date).getTime(),
      }));

    // ── 2. Main calendar free/busy (personal events) ──────────────
    let personalBusy = [];
    if (mainCalId) {
      const fbRes = await calendar.freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          items: [{ id: mainCalId }],
        },
      });
      const calData = fbRes.data.calendars?.[mainCalId];
      if (calData?.errors?.length) {
        console.error("FreeBusy errors for main calendar:", JSON.stringify(calData.errors));
      }
      personalBusy = (calData?.busy ?? []).map(b => ({
        start: new Date(b.start).getTime(),
        end:   new Date(b.end).getTime(),
      }));
    }

    // ── 3. Merge all blocking times ───────────────────────────────
    const allBusy = [...consultingBusy, ...personalBusy]
      .sort((a, b) => a.start - b.start);

    // Start from the next 15-minute boundary (small booking buffer)
    const windowStart = Math.ceil(now.getTime() / 900_000) * 900_000;
    const windowEnd   = new Date(timeMax).getTime();

    const freeSlots = [];
    const busySlots = [];

    for (const avail of availableBlocks) {
      const blockStart = Math.max(avail.start, windowStart);
      const blockEnd   = Math.min(avail.end, windowEnd);
      if (blockStart >= blockEnd) continue;

      // All blocking events that overlap this Available block
      const overlapping = allBusy
        .filter(b => b.end > blockStart && b.start < blockEnd)
        .sort((a, b) => a.start - b.start);

      // Sold-out slots (clipped to the Available window)
      for (const b of overlapping) {
        busySlots.push({
          start: new Date(Math.max(b.start, blockStart)).toISOString(),
          end:   new Date(Math.min(b.end, blockEnd)).toISOString(),
        });
      }

      // Free intervals = Available block minus all blocking times
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
