const nodemailer = require("nodemailer");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { firstName, lastName, email, organization, message } = req.body || {};

  if (!firstName || !email || !message) {
    return res.status(400).json({ error: "Missing required fields: firstName, email, message" });
  }

  const GMAIL_USER = process.env.GMAIL_USER || process.env.DAISY_EMAIL;
  const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

  if (!GMAIL_USER || !GMAIL_PASS) {
    console.warn("Contact email skipped: set GMAIL_USER and GMAIL_APP_PASSWORD in .env");
    return res.status(500).json({ error: "Email service not configured" });
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(26,23,20,.08);">
    <div style="background:#1C3870;padding:32px 40px;">
      <table cellpadding="0" cellspacing="0" style="width:100%"><tr>
        <td style="vertical-align:middle;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;padding-right:12px;">
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
          </tr></table>
        </td>
        <td style="text-align:right;vertical-align:middle;">
          <span style="display:inline-block;background:#28A880;color:#ffffff;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:6px 14px;border-radius:20px;">New Message</span>
        </td>
      </tr></table>
    </div>

    <div style="padding:40px;">
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:500;color:#1A1714;margin:0 0 8px;">New website inquiry</h1>
      <p style="font-size:16px;color:#4A4540;margin:0 0 32px;line-height:1.75;">
        Someone reached out via your contact form.
      </p>

      <div style="background:#F5F0E8;border-radius:10px;padding:24px 28px;margin-bottom:32px;">
        <p style="font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#7A746E;margin:0 0 16px;">Contact Details</p>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;width:110px;vertical-align:top;">
              <span style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#AEA290;">Name</span>
            </td>
            <td style="padding:8px 0;vertical-align:top;">
              <span style="font-size:15px;color:#1A1714;font-weight:500;">${fullName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;vertical-align:top;border-top:1px solid #DDD5C4;">
              <span style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#AEA290;">Email</span>
            </td>
            <td style="padding:8px 0;vertical-align:top;border-top:1px solid #DDD5C4;">
              <a href="mailto:${email}" style="font-size:15px;color:#28A880;text-decoration:none;">${email}</a>
            </td>
          </tr>
          ${organization ? `
          <tr>
            <td style="padding:8px 0;vertical-align:top;border-top:1px solid #DDD5C4;">
              <span style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#AEA290;">Organization</span>
            </td>
            <td style="padding:8px 0;vertical-align:top;border-top:1px solid #DDD5C4;">
              <span style="font-size:15px;color:#1A1714;">${organization}</span>
            </td>
          </tr>` : ""}
        </table>
      </div>

      <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:500;color:#1A1714;margin:0 0 12px;">Message</h2>
      <div style="font-size:15px;color:#4A4540;line-height:1.85;white-space:pre-wrap;margin-bottom:32px;">${message}</div>

      <div style="border-top:1px solid #DDD5C4;padding-top:24px;">
        <a href="mailto:${email}" style="display:inline-block;background:#28A880;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">Reply to ${firstName} →</a>
      </div>
    </div>

    <div style="background:#F5F0E8;padding:20px 40px;text-align:center;">
      <p style="font-size:12px;color:#AEA290;margin:0;line-height:1.6;">
        Daisy Han Consulting LLC · Makawao, Hawaii
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
    from:     `"Daisy Han Consulting" <${GMAIL_USER}>`,
    to:       GMAIL_USER,
    replyTo:  `"${fullName}" <${email}>`,
    subject:  `New inquiry from ${fullName}${organization ? ` · ${organization}` : ""}`,
    html,
  });

  console.log(`Contact form submission from ${fullName} <${email}>`);
  return res.status(200).json({ ok: true });
};
