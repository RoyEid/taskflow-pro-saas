import nodemailer from "nodemailer";

function hasEmailConfig() {
  return (
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
  );
}

function getFromAddress() {
  const emailFrom = process.env.EMAIL_FROM;
  const emailFromName = process.env.EMAIL_FROM_NAME || "TaskFlow Pro";
  const emailUser = process.env.EMAIL_USER;

  if (emailFrom && emailFrom.includes("<") && emailFrom.includes(">")) {
    return emailFrom;
  }

  if (emailFrom) {
    return `${emailFromName} <${emailFrom}>`;
  }

  return `${emailFromName} <${emailUser}>`;
}

function getEmailType(subject = "") {
  const lowerSubject = subject.toLowerCase();

  if (lowerSubject.includes("password") || lowerSubject.includes("reset")) {
    return {
      title: "Reset your password",
      subtitle: "Use the code below to reset your TaskFlow Pro password.",
      badge: "Password Reset",
    };
  }

  if (lowerSubject.includes("verify") || lowerSubject.includes("email")) {
    return {
      title: "Verify your email address",
      subtitle: "Use the code below to complete your TaskFlow Pro account setup.",
      badge: "Email Verification",
    };
  }

  return {
    title: "TaskFlow Pro Notification",
    subtitle: "You received a new message from TaskFlow Pro.",
    badge: "Notification",
  };
}

function buildHtmlEmail(options) {
  const emailType = getEmailType(options.subject);
  const code = options.code;

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${emailType.title}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6fb; font-family:Arial, Helvetica, sans-serif; color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fb; padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 12px 35px rgba(17, 24, 39, 0.10);">
            
            <tr>
              <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:34px 30px; text-align:center;">
                <div style="display:inline-block; width:58px; height:58px; line-height:58px; border-radius:16px; background-color:#ffffff; color:#4f46e5; font-size:22px; font-weight:800; margin-bottom:16px;">
                  TF
                </div>
                <h1 style="margin:0; font-size:28px; line-height:1.3; color:#ffffff; font-weight:800;">
                  TaskFlow Pro
                </h1>
                <p style="margin:8px 0 0; color:#e0e7ff; font-size:14px;">
                  Project management made simple
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:34px 34px 10px;">
                <div style="display:inline-block; padding:7px 12px; border-radius:999px; background-color:#eef2ff; color:#4f46e5; font-size:12px; font-weight:700; margin-bottom:18px;">
                  ${emailType.badge}
                </div>

                <h2 style="margin:0 0 10px; font-size:24px; line-height:1.35; color:#111827; font-weight:800;">
                  ${emailType.title}
                </h2>

                <p style="margin:0; font-size:15px; line-height:1.7; color:#4b5563;">
                  ${emailType.subtitle}
                </p>
              </td>
            </tr>

            ${
              code
                ? `
            <tr>
              <td style="padding:22px 34px 12px;">
                <div style="background-color:#f8fafc; border:1px solid #e5e7eb; border-radius:18px; padding:24px; text-align:center;">
                  <p style="margin:0 0 12px; font-size:13px; color:#6b7280; font-weight:700; text-transform:uppercase; letter-spacing:1px;">
                    Your verification code
                  </p>

                  <div style="font-size:38px; line-height:1; font-weight:900; letter-spacing:8px; color:#4f46e5; margin:12px 0;">
                    ${code}
                  </div>

                  <p style="margin:14px 0 0; font-size:13px; color:#6b7280;">
                    This code will expire in <strong style="color:#111827;">15 minutes</strong>.
                  </p>
                </div>
              </td>
            </tr>
            `
                : `
            <tr>
              <td style="padding:22px 34px 12px;">
                <div style="background-color:#f8fafc; border:1px solid #e5e7eb; border-radius:18px; padding:22px;">
                  <p style="margin:0; font-size:15px; line-height:1.7; color:#374151;">
                    ${options.message || "You have a new notification from TaskFlow Pro."}
                  </p>
                </div>
              </td>
            </tr>
            `
            }

            <tr>
              <td style="padding:12px 34px 30px;">
                <p style="margin:0; font-size:14px; line-height:1.7; color:#6b7280;">
                  If you did not request this email, you can safely ignore it.
                </p>
              </td>
            </tr>

            <tr>
              <td style="background-color:#f9fafb; padding:22px 34px; border-top:1px solid #e5e7eb; text-align:center;">
                <p style="margin:0 0 6px; font-size:13px; color:#6b7280;">
                  Sent by <strong style="color:#111827;">TaskFlow Pro</strong>
                </p>
                <p style="margin:0; font-size:12px; color:#9ca3af;">
                  Manage projects, clients, tasks, and teams in one place.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

function logCodeFallback(options, reason = "Email env variables missing") {
  console.warn(`\n⚠️ WARNING: ${reason}. Verification code logged for development.`);
  console.warn("=================================================");
  console.warn(`To: ${options.email}`);
  console.warn(`Subject: ${options.subject}`);

  if (options.code) {
    console.warn(`CODE: ${options.code}`);
  } else {
    console.warn(`MESSAGE:\n${options.message}`);
  }

  console.warn("=================================================\n");
}

const sendEmail = async (options) => {
  console.log(`[Email] Starting email sending process to ${options.email}...`);

  if (!hasEmailConfig()) {
    logCodeFallback(options, "Email env variables missing");
    return;
  }

  const emailPort = Number(process.env.EMAIL_PORT);

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: emailPort,
      secure: emailPort === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: getFromAddress(),
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || buildHtmlEmail(options),
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(`[Email] ✅ Successfully sent email to ${options.email}`);
    console.log(`[Email Debug]`, {
      optionsEmail: options.email,
      mailOptionsTo: mailOptions.to,
      mailOptionsFrom: mailOptions.from,
      subject: options.subject,
      accepted: result.accepted,
      rejected: result.rejected,
      response: result.response,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error(
      `[Email] ❌ Failed to send email to ${options.email}:`,
      error.message
    );

    if (process.env.NODE_ENV === "development") {
      logCodeFallback(options, "Email sending failed");
      return;
    }

    throw error;
  }
};

export default sendEmail;