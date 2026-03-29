const { google } = require("googleapis");

// Working hours in Hawaii time (Pacific/Honolulu, always UTC-10)
const WORK_START_MIN = 9 * 60;  // 9:00 AM
const WORK_END_MIN   = 17 * 60; // 5:00 PM

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

// Hawaii is always UTC-10 (no DST). Returns a Date whose UTC fields hold Hawaii local values.
function toHawaiiDate(utcMs) {
  return new Date(utcMs - 10 * 60 * 60 * 1000);
}

function hwDateStr(hw) {
  return hw.getUTCFullYear() + "-" +
         String(hw.getUTCMonth() + 1).padStart(2, "0") + "-" +
         String(hw.getUTCDate()).padStart(2, "0");
}

function hwMinOfDay(hw) {
  return hw.getUTCHours() * 60 + hw.getUTCMinutes();
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");

  try {
    const auth = getAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const freeBusy = await calendar.freebusy.query({
      resource: {
        timeMin,
        timeMax,
        items: [{ id: process.env.GOOGLE_CALENDAR_ID }],
      },
    });

    const busyUTC = freeBusy.data.calendars[process.env.GOOGLE_CALENDAR_ID]?.busy || [];

    // Group busy intervals by Hawaii date as minute-of-day ranges.
    // busyByDay: { "YYYY-MM-DD": [[startMin, endMin], ...] }
    const busyByDay = {};

    for (const { start, end } of busyUTC) {
      const sUTC = new Date(start);
      const eUTC = new Date(end);

      // Find the start of the Hawaii day containing sUTC.
      // Hawaii midnight = 10:00 UTC that same calendar day.
      const sHw = toHawaiiDate(sUTC.getTime());
      let dayStartUTC = Date.UTC(
        sHw.getUTCFullYear(), sHw.getUTCMonth(), sHw.getUTCDate(),
        10, 0, 0, 0
      );

      let safety = 0;
      while (dayStartUTC < eUTC.getTime() && safety++ < 90) {
        const dayEndUTC = dayStartUTC + 24 * 60 * 60 * 1000;

        const clipStart = Math.max(sUTC.getTime(), dayStartUTC);
        const clipEnd   = Math.min(eUTC.getTime(), dayEndUTC);

        if (clipStart < clipEnd) {
          const csHw = toHawaiiDate(clipStart);
          const ceHw = toHawaiiDate(clipEnd);

          const dateStr  = hwDateStr(csHw);
          const startMin = hwMinOfDay(csHw);
          // If clipEnd lands exactly at midnight Hawaii, endMin would be 0 — treat as 24*60
          let endMin = hwMinOfDay(ceHw);
          if (endMin === 0 && clipEnd > clipStart) endMin = 24 * 60;

          if (!busyByDay[dateStr]) busyByDay[dateStr] = [];
          busyByDay[dateStr].push([startMin, endMin]);
        }

        dayStartUTC = dayEndUTC;
      }
    }

    // Build free windows for each day in the 60-day window.
    // freeWindows: { "YYYY-MM-DD": [[startH, startM, endH, endM], ...] }
    const freeWindows = {};
    const todayHwStr = hwDateStr(toHawaiiDate(now.getTime()));

    for (let i = 0; i < 62; i++) {
      const dayMs = now.getTime() + i * 24 * 60 * 60 * 1000;
      const dateStr = hwDateStr(toHawaiiDate(dayMs));

      if (dateStr < todayHwStr) continue; // skip past Hawaii dates
      if (freeWindows[dateStr] !== undefined) continue; // dedupe

      const dayBusy = (busyByDay[dateStr] || [])
        .slice()
        .sort((a, b) => a[0] - b[0]);

      // Compute free intervals = working hours minus busy
      const free = [];
      let cursor = WORK_START_MIN;

      for (const [bs, be] of dayBusy) {
        const busyStart = Math.max(bs, WORK_START_MIN);
        const busyEnd   = Math.min(be, WORK_END_MIN);
        if (busyEnd <= busyStart) continue;
        if (cursor < busyStart) free.push([cursor, busyStart]);
        cursor = Math.max(cursor, busyEnd);
      }
      if (cursor < WORK_END_MIN) free.push([cursor, WORK_END_MIN]);

      if (free.length > 0) {
        freeWindows[dateStr] = free.map(([s, e]) => [
          Math.floor(s / 60), s % 60,
          Math.floor(e / 60), e % 60,
        ]);
      }
    }

    return res.json({ freeWindows });
  } catch (err) {
    console.error("Availability fetch error:", err.message);
    return res.json({ freeWindows: {}, error: err.message });
  }
};
