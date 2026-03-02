const nodemailer = require('nodemailer');

// ─── Singleton SMTP Transport ─────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: Number(process.env.MAIL_PORT) === 465,
  family: 4, // force IPv4 — Render free tier has no IPv6 routing
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server Ready');
  }
});

// Central sendMail wrapper with logging
const sendMail = async (options) => {
  try {
    await transporter.sendMail(options);
    console.log('Email sent successfully');
  } catch (err) {
    console.error('Email send failed:', err);
  }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────
/**
 * Sends an account verification email.
 * @param {string} toEmail  – recipient address
 * @param {string} toName   – recipient display name
 * @param {string} token    – raw (unhashed) verification token
 */
const sendVerificationEmail = async (toEmail, toName, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"OpsBoard" <${process.env.MAIL_USER}>`,
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

  await sendMail(mailOptions);
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
  const teamUrl = `${process.env.CLIENT_URL}/team/${teamId}`;

  const mailOptions = {
    from: `"OpsBoard" <${process.env.MAIL_USER}>`,
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

  await sendMail(mailOptions);
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
  const deadlineStr = new Date(deadline).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  await sendMail({
    from: `"OpsBoard" <${process.env.MAIL_USER}>`,
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
  const deadlineStr = new Date(deadline).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  await sendMail({
    from: `"OpsBoard" <${process.env.MAIL_USER}>`,
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

// ─── Task Assignment Email ─────────────────────────────────────────────────────
/**
 * Notifies a user that a task has been assigned to them.
 * @param {string} toEmail   – recipient address
 * @param {string} toName    – recipient display name
 * @param {string} taskTitle – task title
 * @param {Date|string} deadline – task deadline
 * @param {string} teamId    – MongoDB team id (for deep-link)
 */
const sendTaskAssignmentEmail = async (toEmail, toName, taskTitle, deadline, teamId) => {
  const teamUrl = `${process.env.CLIENT_URL}/team/${teamId}`;

  const deadlineStr = deadline
    ? new Date(deadline).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'No deadline set';

  await sendMail({
    from: `"OpsBoard" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: 'You have been assigned a new task in OpsBoard',
    text: `Hi ${toName},\n\nYou have been assigned the task:\n"${taskTitle}"\n\nDeadline: ${deadlineStr}\n\nVisit: ${teamUrl}\n\nOpsBoard`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <div style="display:inline-block;width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);text-align:center;line-height:48px;font-size:20px;font-weight:800;color:#fff;">O</div>
              <p style="margin:10px 0 0;font-size:18px;font-weight:700;color:rgba(255,255,255,0.9);">OpsBoard</p>
            </td>
          </tr>
          <tr>
            <td style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:20px;padding:32px;">
              <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:rgba(255,255,255,0.92);">New task assigned 📋</p>
              <p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">Hi <strong style="color:rgba(255,255,255,0.7);">${toName}</strong>, a new task has been assigned to you.</p>
              <div style="background:rgba(99,102,241,0.1);border-left:3px solid #6366f1;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:rgba(255,255,255,0.85);">${taskTitle}</p>
                <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);">Deadline: ${deadlineStr}</p>
              </div>
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td align="center">
                    <a href="${teamUrl}" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">View Task Board</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">You received this because a task was assigned to you in OpsBoard.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
};

// ─── Task Permission Email ────────────────────────────────────────────────────
/**
 * Notifies a member that the admin has granted them task-creation permission.
 * @param {string} toEmail    – recipient address
 * @param {string} toName     – recipient display name
 * @param {string} adminName  – name of the admin who granted permission
 * @param {string} teamName   – name of the team
 * @param {string} teamId     – MongoDB team id (for deep-link)
 */
const sendTaskPermissionEmail = async (toEmail, toName, adminName, teamName, teamId) => {
  const teamUrl = `${process.env.CLIENT_URL}/team/${teamId}`;

  await sendMail({
    from: `"OpsBoard" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: `You can now create tasks in "${teamName}" — OpsBoard`,
    text: `Hi ${toName},\n\n${adminName} has granted you permission to create tasks in the "${teamName}" team on OpsBoard.\n\nHead to your board to get started:\n${teamUrl}\n\nOpsBoard`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
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
            <td style="background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.18);border-radius:20px;padding:32px;">

              <!-- Icon + heading -->
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td style="padding-bottom:16px;">
                    <div style="display:inline-block;width:42px;height:42px;border-radius:12px;background:rgba(52,211,153,0.15);text-align:center;line-height:42px;font-size:20px;">&#x2705;</div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:rgba(255,255,255,0.92);">Permission granted!</p>
              <p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">
                Hi <strong style="color:rgba(255,255,255,0.75);">${toName}</strong>,
                <strong style="color:rgba(255,255,255,0.75);">${adminName}</strong> has granted you
                <strong style="color:#34d399;">task creation permission</strong> in the team
                <strong style="color:rgba(255,255,255,0.75);">${teamName}</strong>.
                You can now add new tasks directly from the board.
              </p>

              <!-- Highlight box -->
              <div style="background:rgba(52,211,153,0.08);border-left:3px solid #34d399;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.5;">
                  &#x1f4cb;&nbsp; Click the <strong style="color:rgba(255,255,255,0.8);">+ Add task</strong> button in the
                  <strong style="color:rgba(255,255,255,0.8);">To-Do</strong> column to get started.
                </p>
              </div>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td align="center">
                    <a href="${teamUrl}"
                       style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#34d399,#059669);border-radius:10px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:-0.1px;">
                      Open Task Board
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">You received this because your team admin updated your permissions in OpsBoard.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
};

// ─── Task Permission Revoked Email ───────────────────────────────────────────
/**
 * Notifies a member that the admin has revoked their task-creation permission.
 * @param {string} toEmail    – recipient address
 * @param {string} toName     – recipient display name
 * @param {string} adminName  – name of the admin who revoked permission
 * @param {string} teamName   – name of the team
 * @param {string} teamId     – MongoDB team id (for deep-link)
 */
const sendTaskPermissionRevokedEmail = async (toEmail, toName, adminName, teamName, teamId) => {
  const teamUrl = `${process.env.CLIENT_URL}/team/${teamId}`;

  await sendMail({
    from: `"OpsBoard" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: `Your task creation permission in "${teamName}" has been removed — OpsBoard`,
    text: `Hi ${toName},\n\n${adminName} has removed your task creation permission in the "${teamName}" team on OpsBoard.\n\nYou can still view and work on existing tasks.\n\nView board: ${teamUrl}\n\nOpsBoard`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
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
            <td style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.18);border-radius:20px;padding:32px;">

              <!-- Icon -->
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td style="padding-bottom:16px;">
                    <div style="display:inline-block;width:42px;height:42px;border-radius:12px;background:rgba(239,68,68,0.12);text-align:center;line-height:42px;font-size:20px;">&#x1f512;</div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:rgba(255,255,255,0.92);">Permission removed</p>
              <p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">
                Hi <strong style="color:rgba(255,255,255,0.75);">${toName}</strong>,
                <strong style="color:rgba(255,255,255,0.75);">${adminName}</strong> has
                <strong style="color:#f87171;">removed your task creation permission</strong> in the team
                <strong style="color:rgba(255,255,255,0.75);">${teamName}</strong>.
                You can still view and update existing tasks assigned to you.
              </p>

              <!-- Info box -->
              <div style="background:rgba(239,68,68,0.08);border-left:3px solid #ef4444;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.5;">
                  &#x2139;&#xfe0f;&nbsp; If you believe this was a mistake, please contact your team admin.
                </p>
              </div>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td align="center">
                    <a href="${teamUrl}"
                       style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:-0.1px;">
                      Go to Task Board
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">You received this because your team admin updated your permissions in OpsBoard.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
};

// ─── Admin: Task Assigned Notification ───────────────────────────────────────
/**
 * Notifies an admin that a task has been assigned within their team.
 * @param {string} toEmail       – recipient address (admin)
 * @param {string} toName        – recipient display name
 * @param {string} taskTitle     – task title
 * @param {string} actorName     – who performed the assignment
 * @param {string} assigneeName  – who the task was assigned to
 * @param {string} teamName      – team name
 * @param {string} teamUrl       – frontend deep-link to the team board
 */
const sendAdminTaskAssignedEmail = async (
  toEmail,
  toName,
  taskTitle,
  actorName,
  assigneeName,
  teamName,
  teamUrl
) => {
  await sendMail({
    from: `"OpsBoard" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: 'New Task Assigned in OpsBoard',
    text: `Hi ${toName},\n\nA task has been assigned in your team.\n\nTask: ${taskTitle}\nAssigned By: ${actorName}\nAssigned To: ${assigneeName}\nTeam: ${teamName}\n\nView board: ${teamUrl}\n\nOpsBoard`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
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
            <td style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:20px;padding:32px;">
              <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:rgba(255,255,255,0.92);">New Task Assigned &#x1f4cb;</p>
              <p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">Hi <strong style="color:rgba(255,255,255,0.7);">${toName}</strong>, a task has been assigned in your team.</p>

              <!-- Detail block -->
              <div style="background:rgba(99,102,241,0.1);border-left:3px solid #6366f1;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding-bottom:6px;">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.3);">Task</span><br/>
                    <span style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.85);">${taskTitle}</span>
                  </td></tr>
                  <tr><td style="padding-bottom:6px;">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.3);">Assigned By</span><br/>
                    <span style="font-size:13px;color:rgba(255,255,255,0.6);">${actorName}</span>
                  </td></tr>
                  <tr><td style="padding-bottom:6px;">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.3);">Assigned To</span><br/>
                    <span style="font-size:13px;color:rgba(255,255,255,0.6);">${assigneeName}</span>
                  </td></tr>
                  <tr><td>
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.3);">Team</span><br/>
                    <span style="font-size:13px;color:rgba(255,255,255,0.6);">${teamName}</span>
                  </td></tr>
                </table>
              </div>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td align="center">
                    <a href="${teamUrl}" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">View Task Board</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">You received this as a team admin in OpsBoard.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
};

// ─── All Members: Task Completed Notification ─────────────────────────────────
/**
 * Notifies all team members that a task has been completed.
 * @param {string} toEmail    – recipient address
 * @param {string} toName     – recipient display name
 * @param {string} taskTitle  – task title
 * @param {string} actorName  – who completed the task
 * @param {string} teamName   – team name
 * @param {string} teamUrl    – frontend deep-link to the team board
 */
const sendTeamTaskCompletedEmail = async (
  toEmail,
  toName,
  taskTitle,
  actorName,
  teamName,
  teamUrl
) => {
  await sendMail({
    from: `"OpsBoard" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: 'Task Completed in OpsBoard',
    text: `Hi ${toName},\n\nA task has been completed in your team.\n\nTask: ${taskTitle}\nCompleted By: ${actorName}\nTeam: ${teamName}\n\nView board: ${teamUrl}\n\nOpsBoard`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <div style="display:inline-block;width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#34d399,#059669);text-align:center;line-height:48px;font-size:20px;font-weight:800;color:#fff;">O</div>
              <p style="margin:10px 0 0;font-size:18px;font-weight:700;color:rgba(255,255,255,0.9);">OpsBoard</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.18);border-radius:20px;padding:32px;">
              <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:rgba(255,255,255,0.92);">Task Completed &#x2705;</p>
              <p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">Hi <strong style="color:rgba(255,255,255,0.7);">${toName}</strong>, great news — a task has been completed in your team!</p>

              <!-- Detail block -->
              <div style="background:rgba(52,211,153,0.08);border-left:3px solid #34d399;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding-bottom:6px;">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.3);">Task</span><br/>
                    <span style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.85);">${taskTitle}</span>
                  </td></tr>
                  <tr><td style="padding-bottom:6px;">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.3);">Completed By</span><br/>
                    <span style="font-size:13px;color:rgba(255,255,255,0.6);">${actorName}</span>
                  </td></tr>
                  <tr><td>
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.3);">Team</span><br/>
                    <span style="font-size:13px;color:rgba(255,255,255,0.6);">${teamName}</span>
                  </td></tr>
                </table>
              </div>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td align="center">
                    <a href="${teamUrl}" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#34d399,#059669);border-radius:10px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">View Task Board</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">You received this as a member of the ${teamName} team in OpsBoard.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
};

// ─── All Members: Task Blocked Notification ──────────────────────────────────
/**
 * Notifies all team members that a task has been blocked.
 * @param {string} toEmail       – recipient address
 * @param {string} toName        – recipient display name
 * @param {string} taskTitle     – task title
 * @param {string} actorName     – who blocked the task
 * @param {string} blockerReason – reason for the blocker
 * @param {string} teamName      – team name
 * @param {string} teamUrl       – frontend deep-link to the team board
 */
const sendTeamTaskBlockedEmail = async (
  toEmail,
  toName,
  taskTitle,
  actorName,
  blockerReason,
  teamName,
  teamUrl
) => {
  await sendMail({
    from: `"OpsBoard" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: `Task Blocked in OpsBoard — "${taskTitle}"`,
    text: `Hi ${toName},\n\nA task has been blocked in your team.\n\nTask: ${taskTitle}\nBlocked By: ${actorName}\nReason: ${blockerReason}\nTeam: ${teamName}\n\nView board: ${teamUrl}\n\nOpsBoard`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <div style="display:inline-block;width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#f59e0b,#d97706);text-align:center;line-height:48px;font-size:20px;font-weight:800;color:#fff;">O</div>
              <p style="margin:10px 0 0;font-size:18px;font-weight:700;color:rgba(255,255,255,0.9);">OpsBoard</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.22);border-radius:20px;padding:32px;">
              <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:rgba(255,255,255,0.92);">Task Blocked &#x26a0;&#xfe0f;</p>
              <p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">Hi <strong style="color:rgba(255,255,255,0.7);">${toName}</strong>, a task in your team has been blocked and needs attention.</p>

              <!-- Detail block -->
              <div style="background:rgba(245,158,11,0.1);border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding-bottom:6px;">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.3);">Task</span><br/>
                    <span style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.85);">${taskTitle}</span>
                  </td></tr>
                  <tr><td style="padding-bottom:6px;">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.3);">Blocked By</span><br/>
                    <span style="font-size:13px;color:rgba(255,255,255,0.6);">${actorName}</span>
                  </td></tr>
                  <tr><td style="padding-bottom:6px;">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.3);">Reason</span><br/>
                    <span style="font-size:13px;color:#fbbf24;">${blockerReason}</span>
                  </td></tr>
                  <tr><td>
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.3);">Team</span><br/>
                    <span style="font-size:13px;color:rgba(255,255,255,0.6);">${teamName}</span>
                  </td></tr>
                </table>
              </div>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td align="center">
                    <a href="${teamUrl}" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:10px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">View Task Board</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:20px;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">You received this as a member of the ${teamName} team in OpsBoard.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
};

module.exports = {
  sendVerificationEmail,
  sendMentionEmail,
  sendDeadlineWarningEmail,
  sendOverdueTaskEmail,
  sendTaskAssignmentEmail,
  sendTaskPermissionEmail,
  sendTaskPermissionRevokedEmail,
  sendAdminTaskAssignedEmail,
  sendTeamTaskCompletedEmail,
  sendTeamTaskBlockedEmail,
};
