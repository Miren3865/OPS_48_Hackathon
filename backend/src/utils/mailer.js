const nodemailer = require('nodemailer');

// ─── Transport ────────────────────────────────────────────────────────────────
// Uses nodemailer's built-in Gmail service preset which correctly handles
// OAuth/TLS negotiation without manual host/port/secure flags.
// Requires EMAIL_USER (Gmail address) and EMAIL_PASS (16-char App Password).
const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// ─── Verify Email ─────────────────────────────────────────────────────────────
/**
 * Sends an account verification email.
 * @param {string} toEmail  – recipient address
 * @param {string} toName   – recipient display name
 * @param {string} token    – raw (unhashed) verification token
 */
const sendVerificationEmail = async (toEmail, toName, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

  const transporter = createTransporter();

  const mailOptions = {
    from: `"OpsBoard" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Verify your OpsBoard account',
    text: `Hi ${toName},\n\nPlease verify your email by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you did not register, you can safely ignore this email.`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-block;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);text-align:center;line-height:52px;font-size:22px;font-weight:800;color:#fff;">O</div>
              <p style="margin:12px 0 0;font-size:20px;font-weight:700;color:rgba(255,255,255,0.9);letter-spacing:-0.5px;">OpsBoard</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px 32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:rgba(255,255,255,0.92);">Verify your email</p>
              <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">Hi ${toName}, you're almost there! Click the button below to verify your OpsBoard account.</p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <a href="${verifyUrl}"
                       style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">
                      Verify email address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.3);text-align:center;">Link expires in <strong style="color:rgba(255,255,255,0.5);">24 hours</strong>.</p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);text-align:center;word-break:break-all;">Or copy: ${verifyUrl}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">If you didn't create an account, you can safely ignore this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };

  await transporter.sendMail(mailOptions);
};

// ─── Mention Notification Email ────────────────────────────────────────────────────
/**
 * Sends a "you were mentioned" notification email.
 * @param {string} toEmail     – recipient address
 * @param {string} toName      – recipient display name
 * @param {string} senderName  – name of the user who mentioned them
 * @param {string} teamName    – name of the team
 * @param {string} teamId      – MongoDB team id (for deep-link)
 * @param {string} messageText – the chat message content
 */
const sendMentionEmail = async (toEmail, toName, senderName, teamName, teamId, messageText) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const teamUrl = `${frontendUrl}/team/${teamId}`;
  const transporter = createTransporter();

  const mailOptions = {
    from: `"OpsBoard" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'You were mentioned in OpsBoard Team Chat',
    text: `Hi ${toName},\n\n${senderName} mentioned you in the "${teamName}" team chat:\n\n"${messageText}"\n\nView the conversation:\n${teamUrl}\n\nOpsBoard`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <div style="display:inline-block;width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);text-align:center;line-height:48px;font-size:20px;font-weight:800;color:#fff;">O</div>
              <p style="margin:10px 0 0;font-size:18px;font-weight:700;color:rgba(255,255,255,0.9);">OpsBoard</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:32px;">
              <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:rgba(255,255,255,0.92);">You were mentioned 💬</p>
              <p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">Hi ${toName}, <strong style="color:rgba(255,255,255,0.7);">${senderName}</strong> mentioned you in the <strong style="color:rgba(255,255,255,0.7);">${teamName}</strong> team chat.</p>

              <!-- Quote block -->
              <div style="background:rgba(99,102,241,0.12);border-left:3px solid #6366f1;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7);font-style:italic;line-height:1.6;">&ldquo;${messageText}&rdquo;</p>
              </div>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td align="center">
                    <a href="${teamUrl}" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:10px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">View Conversation</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">You received this because you were mentioned in an OpsBoard team chat.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendMentionEmail };
