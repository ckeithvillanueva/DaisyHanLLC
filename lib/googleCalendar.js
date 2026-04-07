const { google }    = require("googleapis");
const nodemailer    = require("nodemailer");

// ── Auth ─────────────────────────────────────────────────────────

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
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

// ── Calendar event creation ───────────────────────────────────────

/**
 * Creates a Google Calendar event on Daisy's primary calendar.
 *
 * - Adds the client as an attendee so Google automatically sends them a
 *   calendar invitation (with the Google Meet link) via sendUpdates:'all'.
 * - No timezone is hardcoded — ISO strings are timezone-neutral; Google
 *   Calendar renders the event in each attendee's own local timezone.
 */
async function createBookingEvent({ summary, startTime, endTime, userEmail, description }) {
  const auth     = getAuth();
  const calendar = google.calendar({ version: "v3", auth });

  const consultingCalId = process.env.GOOGLE_CONSULTING_CALENDAR_ID || process.env.GOOGLE_CALENDAR_ID || "primary";
  const mainCalId       = process.env.GOOGLE_MAIN_CALENDAR_ID;

  const baseEvent = {
    summary,
    description,
    start: { dateTime: startTime },
    end:   { dateTime: endTime },
    conferenceData: {
      createRequest: { requestId: `booking-${Date.now()}` },
    },
  };

  // 1. Consulting LLC calendar — marks the slot as taken.
  //    Note: service accounts cannot add attendees without Domain-Wide Delegation,
  //    so the client is notified via the confirmation email instead.
  const response = await calendar.events.insert({
    calendarId:            consultingCalId,
    resource:              { ...baseEvent },
    conferenceDataVersion: 1,
    sendUpdates:           "none",
  });

  // 2. Main Gmail calendar — clean copy for Daisy's personal view.
  //    No attendees so the client doesn't receive a duplicate invite.
  if (mainCalId) {
    await calendar.events.insert({
      calendarId:            mainCalId,
      resource:              { ...baseEvent },
      conferenceDataVersion: 1,
      sendUpdates:           "none",
    });
  }

  return response.data;
}

// ── Confirmation email ────────────────────────────────────────────

/**
 * Sends a branded HTML confirmation email to the client via Gmail SMTP.
 *
 * Requires in .env:
 *   GMAIL_USER         — sending address (e.g. daisyheyjinhan@gmail.com)
 *   GMAIL_APP_PASSWORD — Gmail App Password (not the account password).
 *                        Generate at: myaccount.google.com → Security → App passwords
 *
 * If either var is missing the function logs a warning and returns silently
 * so the webhook handler never fails because of a missing email credential.
 *
 * NOTE: The Google Calendar invite (sent via sendUpdates:'all' above) is the
 * "meeting invite". This email is the separate booking confirmation.
 */
async function sendConfirmationEmail({
  userEmail, userName, startTime, endTime, topic, session,
}) {
  const GMAIL_USER = process.env.GMAIL_USER || process.env.DAISY_EMAIL;
  const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_PASS) {
    console.warn(
      "Confirmation email skipped: set GMAIL_USER and GMAIL_APP_PASSWORD in .env"
    );
    return;
  }
  if (!userEmail) {
    console.warn("Confirmation email skipped: no userEmail provided");
    return;
  }

  // Format the date/time for display.
  // Show a human-friendly UTC representation; the calendar invite shows
  // the time in each recipient's own local timezone automatically.
  const startDate = new Date(startTime);
  const endDate   = new Date(endTime);

  const dateStr  = startDate.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "UTC",
  });
  const timeRange = [
    startDate.toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", timeZone: "UTC",
    }),
    endDate.toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", timeZone: "UTC", timeZoneName: "short",
    }),
  ].join(" – ");

  const sessionLabel = session || "Consulting Call";
  const greeting     = userName ? `Hi ${userName},` : "Hi there,";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(26,23,20,.08);">

    <!-- Header -->
    <div style="background:#1C3870;padding:32px 40px;">
      <table cellpadding="0" cellspacing="0" style="width:100%">
        <tr>
          <td style="vertical-align:middle;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;padding-right:12px;">
                  <!-- Sunrise logo (inline SVG) -->
                  <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <defs><clipPath id="c"><circle cx="50" cy="50" r="50"/></clipPath></defs>
                    <g clip-path="url(#c)">
                      <rect x="0" y="0"    width="100" height="14.3" fill="#F2C02E"/>
                      <rect x="0" y="14.3" width="100" height="14.3" fill="#F07A28"/>
                      <rect x="0" y="28.6" width="100" height="14.3" fill="#E84E28"/>
                      <rect x="0" y="42.9" width="100" height="14.3" fill="#E02458"/>
                      <rect x="0" y="57.1" width="100" height="14.3" fill="#28A880"/>
                      <rect x="0" y="71.4" width="100" height="14.3" fill="#2870BC"/>
                      <rect x="0" y="85.7" width="100" height="14.3" fill="#1C3870"/>
                    </g>
                  </svg>
                </td>
                <td style="vertical-align:middle;">
                  <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:600;color:#ffffff;line-height:1.2;">Daisy Han</div>
                  <div style="font-size:12px;color:rgba(255,255,255,.55);letter-spacing:.05em;margin-top:2px;">Consulting LLC</div>
                </td>
              </tr>
            </table>
          </td>
          <td style="text-align:right;vertical-align:middle;">
            <span style="display:inline-block;background:#28A880;color:#ffffff;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:6px 14px;border-radius:20px;">Confirmed ✓</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:500;color:#1A1714;margin:0 0 8px;line-height:1.2;">
        You're all set!
      </h1>
      <p style="font-size:16px;color:#4A4540;margin:0 0 32px;line-height:1.75;">
        ${greeting} your consultation with Daisy Han is confirmed.
        You'll receive a separate <strong>Google Calendar invitation</strong> with the
        Google Meet link — check your email and accept it to add it to your calendar.
      </p>

      <!-- Booking details -->
      <div style="background:#F5F0E8;border-radius:10px;padding:24px 28px;margin-bottom:32px;">
        <p style="font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#7A746E;margin:0 0 16px;">Booking Details</p>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;width:90px;vertical-align:top;">
              <span style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#AEA290;">Session</span>
            </td>
            <td style="padding:8px 0;vertical-align:top;">
              <span style="font-size:15px;color:#1A1714;font-weight:500;">${sessionLabel}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;vertical-align:top;border-top:1px solid #DDD5C4;">
              <span style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#AEA290;">Date</span>
            </td>
            <td style="padding:8px 0;vertical-align:top;border-top:1px solid #DDD5C4;">
              <span style="font-size:15px;color:#1A1714;">${dateStr}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;vertical-align:top;border-top:1px solid #DDD5C4;">
              <span style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#AEA290;">Time</span>
            </td>
            <td style="padding:8px 0;vertical-align:top;border-top:1px solid #DDD5C4;">
              <span style="font-size:15px;color:#1A1714;">${timeRange}</span>
              <br>
              <span style="font-size:12px;color:#7A746E;">Your calendar invite shows the time in your local timezone.</span>
            </td>
          </tr>
          ${topic ? `
          <tr>
            <td style="padding:8px 0;vertical-align:top;border-top:1px solid #DDD5C4;">
              <span style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#AEA290;">Topic</span>
            </td>
            <td style="padding:8px 0;vertical-align:top;border-top:1px solid #DDD5C4;">
              <span style="font-size:15px;color:#1A1714;">${topic}</span>
            </td>
          </tr>` : ""}
        </table>
      </div>

      <!-- Before the call -->
      <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:500;color:#1A1714;margin:0 0 12px;">Before your call</h2>
      <ul style="font-size:15px;color:#4A4540;line-height:1.85;padding-left:20px;margin:0 0 32px;">
        <li style="margin-bottom:6px;"><strong>Accept your calendar invite</strong> — it includes the Google Meet link for the call.</li>
        <li style="margin-bottom:6px;">Jot down your top questions or goals for the session.</li>
        <li>Have any relevant materials or context ready to share.</li>
      </ul>

      <!-- Questions -->
      <div style="border-top:1px solid #DDD5C4;padding-top:24px;">
        <p style="font-size:14px;color:#7A746E;margin:0;line-height:1.75;">
          Questions or need to reschedule?<br>
          Reach Daisy at
          <a href="mailto:daisyheyjinhan@gmail.com" style="color:#28A880;text-decoration:none;">daisyheyjinhan@gmail.com</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#F5F0E8;padding:20px 40px;text-align:center;">
      <p style="font-size:12px;color:#AEA290;margin:0;line-height:1.6;">
        Daisy Han Consulting LLC · Makawao, Hawaii<br>
        <a href="https://linkedin.com/in/christinedaisyhan" style="color:#AEA290;text-decoration:none;">LinkedIn</a>
      </p>
    </div>

  </div>
</body>
</html>`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });

  await transporter.sendMail({
    from:    `"Daisy Han Consulting" <${GMAIL_USER}>`,
    to:      userEmail,
    subject: `Confirmed: Your ${sessionLabel} on ${dateStr}`,
    html,
  });

  console.log(`Confirmation email sent to ${userEmail}`);
}

module.exports = { createBookingEvent, sendConfirmationEmail };
