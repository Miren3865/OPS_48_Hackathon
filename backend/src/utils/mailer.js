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

// ─── Deadline Warning Email ─────────────────────────────────────────────────────
/**
 * Task-nearing-deadline email notification.
 * @param {string} toEmail    – recipient address
 * @param {string} toName     – recipient display name
 * @param {string} taskTitle  – task title
 * @param {Date}   deadline   – deadline Date object
 * @param {string} teamName   – team name
 * @param {string} teamUrl    – frontend deep-link to the team board
 */
const sendDeadlineWarningEmail = async (toEmail, toName, taskTitle, deadline, teamName, teamUrl) => {
  const transporter = createTransporter();
  const deadlineStr = new Date(deadline).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  await transporter.sendMail({
    from: `"OpsBoard" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `⏰ Task nearing deadline — "${taskTitle}"`,
    text: `Hi ${toName},\n\nThe task "${taskTitle}" in team "${teamName}" is due soon.\nDeadline: ${deadlineStr}\n\nView board: ${teamUrl}\n\nOpsBoard`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
  <table width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding-bottom:24px;">
      <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#f59e0b,#ef4444);display:inline-flex;align-items:center;justify-content:center;font-size:20px;">&#x23f0;</div>
      <p style="margin:8px 0 0;font-size:18px;font-weight:700;color:rgba(255,255,255,0.9);">OpsBoard</p>
    </td></tr>
    <tr><td style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:20px;padding:28px 28px;">
      <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:rgba(255,255,255,0.92);">Deadline approaching &#x23f0;</p>
      <p style="margin:0 0 16px;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.6;">Hi ${toName}, a task you are responsible for is due soon in <strong style="color:rgba(255,255,255,0.7);">${teamName}</strong>.</p>
      <div style="background:rgba(245,158,11,0.1);border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#fbbf24;">${taskTitle}</p>
        <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);">Due: ${deadlineStr}</p>
      </div>
      <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
        <a href="${teamUrl}" style="display:inline-block;padding:12px 30px;background:linear-gradient(135deg,#f59e0b,#ef4444);border-radius:10px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">View Task Board</a>
      </td></tr></table>
    </td></tr>
    <tr><td align="center" style="padding-top:18px;"><p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">OpsBoard automated deadline reminder.</p></td></tr>
  </table>
</td></tr></table>
</body></html>`,
  });
};

// ─── Overdue Task Email ───────────────────────────────────────────────────────
/**
 * Strong alert email for tasks that have already passed their deadline.
 */
const sendOverdueTaskEmail = async (toEmail, toName, taskTitle, deadline, teamName, teamUrl) => {
  const transporter = createTransporter();
  const deadlineStr = new Date(deadline).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  await transporter.sendMail({
    from: `"OpsBoard" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🚨 OVERDUE: Task "${taskTitle}" requires immediate action`,
    text: `Hi ${toName},\n\nURGENT: The task "${taskTitle}" in team "${teamName}" is OVERDUE.\nDeadline was: ${deadlineStr}\n\nPlease action this immediately.\nView board: ${teamUrl}\n\nOpsBoard`,
    html: `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
  <table width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding-bottom:24px;">
      <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#dc2626,#7f1d1d);display:inline-flex;align-items:center;justify-content:center;font-size:20px;">&#x1f6a8;</div>
      <p style="margin:8px 0 0;font-size:18px;font-weight:700;color:rgba(255,255,255,0.9);">OpsBoard</p>
    </td></tr>
    <tr><td style="background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.3);border-radius:20px;padding:28px 28px;">
      <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#fca5a5;">Task overdue &#x1f6a8;</p>
      <p style="margin:0 0 16px;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.6;">Hi ${toName}, a task in <strong style="color:rgba(255,255,255,0.7);">${teamName}</strong> has passed its deadline and needs immediate attention.</p>
      <div style="background:rgba(220,38,38,0.15);border-left:3px solid #ef4444;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#f87171;">${taskTitle}</p>
        <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);">Was due: ${deadlineStr}</p>
      </div>
      <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
        <a href="${teamUrl}" style="display:inline-block;padding:12px 30px;background:linear-gradient(135deg,#dc2626,#9f1239);border-radius:10px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">Take Action Now</a>
      </td></tr></table>
    </td></tr>
    <tr><td align="center" style="padding-top:18px;"><p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">OpsBoard automated overdue alert.</p></td></tr>
  </table>
</td></tr></table>
</body></html>`,
  });
};

module.exports = { sendVerificationEmail, sendMentionEmail, sendDeadlineWarningEmail, sendOverdueTaskEmail };
