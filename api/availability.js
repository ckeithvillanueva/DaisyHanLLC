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

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");

  try {
    const auth = getAuth();
    const calendar = google.calendar({ version: "v3", auth });

    // Fetch 60 days of events starting today
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const freeBusy = await calendar.freebusy.query({
      resource: {
        timeMin,
        timeMax,
        timeZone: "Pacific/Honolulu",
        items: [{ id: process.env.GOOGLE_CALENDAR_ID }],
      },
    });

    const busy = freeBusy.data.calendars[process.env.GOOGLE_CALENDAR_ID]?.busy || [];

    // Convert busy ranges to individual 30-min slot strings ("YYYY-MM-DD HH:MM")
    // The booking UI checks slots in 15-min increments but blocks by session start time
    const blocked = new Set();
    for (const { start, end } of busy) {
      const s = new Date(start);
      const e = new Date(end);
      // Walk in 15-min steps across the busy range and block each slot start
      let t = new Date(s);
      t.setSeconds(0, 0);
      // Round down to nearest 15 min
      t.setMinutes(Math.floor(t.getMinutes() / 15) * 15);
      while (t < e) {
        const yyyy = t.getFullYear();
        const mm   = String(t.getMonth() + 1).padStart(2, "0");
        const dd   = String(t.getDate()).padStart(2, "0");
        const hh   = String(t.getHours()).padStart(2, "0");
        const min  = String(t.getMinutes()).padStart(2, "0");
        blocked.add(`${yyyy}-${mm}-${dd} ${hh}:${min}`);
        t = new Date(t.getTime() + 15 * 60 * 1000);
      }
    }

    return res.json({ blocked: Array.from(blocked) });
  } catch (err) {
    console.error("Availability fetch error:", err.message);
    // Return empty blocked list on error so calendar still renders
    return res.json({ blocked: [], error: err.message });
  }
};
