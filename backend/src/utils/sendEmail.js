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

function buildHtmlLayout(options) {
  const { subject, code, badge, title, subtitle, contentHtml, html } = options;
  const useMinimalTheme = options.theme === "minimal";
  const palette = useMinimalTheme
    ? {
        page: "#f5f5f4",
        card: "#ffffff",
        border: "#e7e5e4",
        header: "#ffffff",
        brand: "#1c1917",
        tagline: "#78716c",
        badgeBackground: "#f5f5f4",
        badgeText: "#57534e",
        title: "#1c1917",
        subtitle: "#78716c",
        content: "#44403c",
        note: "#a8a29e",
        footer: "#fafaf9",
        footerPrimary: "#57534e",
        footerSecondary: "#a8a29e",
      }
    : {
        page: "#0f172a",
        card: "#1e293b",
        border: "#334155",
        header: "linear-gradient(135deg,#171717,#292524)",
        brand: "#ffffff",
        tagline: "#A8A29E",
        badgeBackground: "#334155",
        badgeText: "#f8fafc",
        title: "#f8fafc",
        subtitle: "#94a3b8",
        content: "#e2e8f0",
        note: "#64748b",
        footer: "#0f172a",
        footerPrimary: "#94a3b8",
        footerSecondary: "#64748b",
      };
  
  // Resolve badge, title, subtitle
  let resolvedBadge = badge;
  let resolvedTitle = title;
  let resolvedSubtitle = subtitle;
  
  if (!resolvedBadge || !resolvedTitle) {
    const emailType = getEmailType(subject);
    if (!resolvedBadge) resolvedBadge = emailType.badge;
    if (!resolvedTitle) resolvedTitle = emailType.title;
    if (!resolvedSubtitle) resolvedSubtitle = emailType.subtitle;
  }

  const logoUrl = process.env.BRAND_LOGO_URL || `${(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "")}/favicon.png`;
  
  // Determine the inner content HTML
    let bodyContent = "";
  if (contentHtml) {
    bodyContent = contentHtml;
  } else if (html) {
    bodyContent = html;
  } else if (options.message) {
    // If message contains html-like elements, don't double wrap it with simple <p> or escape it.
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(options.message);
    if (hasHtmlTags) {
      bodyContent = options.message;
    } else {
      bodyContent = `<p style="margin:0; font-size:15px; line-height:1.7; color:#f1f5f9; white-space:pre-line;">${options.message}</p>`;
    }
  } else {
    bodyContent = `<p style="margin:0; font-size:15px; line-height:1.7; color:#f1f5f9;">You have a new notification from TaskFlow Pro.</p>`;
  }

  // Handle Code Section
  let codeSection = "";
  if (code) {
    codeSection = `
      <div style="background-color:#0f172a; border:1px solid #334155; border-radius:12px; padding:20px; text-align:center; margin-top:20px;">
        <p style="margin:0 0 8px; font-size:12px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:1px;">
          Your verification code
        </p>
        <div style="font-size:36px; line-height:1; font-weight:800; letter-spacing:6px; color:#f8fafc; margin:8px 0;">
          ${code}
        </div>
        <p style="margin:8px 0 0; font-size:12px; color:#94a3b8;">
          This code will expire in <strong style="color:#f8fafc;">15 minutes</strong>.
        </p>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${resolvedTitle}</title>
  </head>
  <body style="margin:0; padding:0; background-color:${palette.page}; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color:${palette.content};-webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${palette.page}; padding:${useMinimalTheme ? "28px 16px" : "40px 16px"};">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:${palette.card}; border-radius:16px; overflow:hidden; border:1px solid ${palette.border}; box-shadow:${useMinimalTheme ? "0 8px 24px rgba(28,25,23,0.06)" : "0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.2)"};">
            
            <!-- Header Banner -->
            <tr>
              <td style="background:${palette.header}; padding:${useMinimalTheme ? "24px 30px 20px" : "32px 30px"}; text-align:center;${useMinimalTheme ? ` border-bottom:1px solid ${palette.border};` : ""}">
                <img src="${logoUrl}" alt="TaskFlow Pro" width="${useMinimalTheme ? "48" : "60"}" height="${useMinimalTheme ? "48" : "60"}" style="display:inline-block; width:${useMinimalTheme ? "48px" : "60px"}; height:${useMinimalTheme ? "48px" : "60px"}; border-radius:12px; background-color:#ffffff; padding:${useMinimalTheme ? "6px" : "8px"}; border:1px solid ${palette.border}; object-fit:contain; margin-bottom:10px;${useMinimalTheme ? "" : " box-shadow:0 4px 6px rgba(0,0,0,0.15);"}" />
                <h1 style="margin:0; font-size:${useMinimalTheme ? "22px" : "26px"}; line-height:1.2; color:${palette.brand}; font-weight:800; letter-spacing:-0.5px;">
                  TaskFlow Pro
                </h1>
                <p style="margin:6px 0 0; color:${palette.tagline}; font-size:13px; font-weight:500;">
                  Project management made simple
                </p>
              </td>
            </tr>

            <!-- Content Area -->
            <tr>
              <td style="padding:32px 32px 24px;">
                <div style="display:inline-block; padding:5px 10px; border-radius:999px; background-color:${palette.badgeBackground}; color:${palette.badgeText}; font-size:11px; font-weight:700; margin-bottom:16px; text-transform:uppercase; letter-spacing:0.5px;">
                  ${resolvedBadge}
                </div>

                <h2 style="margin:0 0 12px; font-size:22px; line-height:1.3; color:${palette.title}; font-weight:700; letter-spacing:-0.3px;">
                  ${resolvedTitle}
                </h2>

                ${resolvedSubtitle ? `<p style="margin:0 0 20px; font-size:14px; line-height:1.5; color:${palette.subtitle};">${resolvedSubtitle}</p>` : ''}

                <div style="font-size:15px; line-height:1.6; color:${palette.content};">
                  ${bodyContent}
                </div>

                ${codeSection}
              </td>
            </tr>

            <!-- Footer Note -->
            <tr>
              <td style="padding:0 32px 24px;">
                <p style="margin:0; font-size:13px; line-height:1.5; color:${palette.note};">
                  ${!code 
                    ? "This is an automated notification. Please do not reply directly to this email." 
                    : "If you did not request this email, you can safely ignore it."}
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:${palette.footer}; padding:20px 32px; border-top:1px solid ${palette.border}; text-align:center;">
                <p style="margin:0 0 4px; font-size:12px; color:${palette.footerPrimary}; font-weight:600;">
                  Sent by <span style="color:${palette.brand};">TaskFlow Pro</span>
                </p>
                <p style="margin:0; font-size:11px; color:${palette.footerSecondary};">
                  Manage projects, clients, tasks, and teams in one place.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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
  if (process.env.NODE_ENV === "development" || !hasEmailConfig()) {
    console.log(`[Email Dev Log] Code for ${options.email}: ${options.code || options.message}`);
  }

  if (!hasEmailConfig()) {
    logCodeFallback(options, "Email env variables missing");
    throw new Error("Email configuration variables (EMAIL_HOST, EMAIL_PORT, etc.) are missing");
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
      connectionTimeout: 5000, // 5 seconds connection timeout
      socketTimeout: 5000,     // 5 seconds socket timeout
    });

    const mailOptions = {
      from: getFromAddress(),
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: buildHtmlLayout(options),
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

    return result;
  } catch (error) {
    console.error(
      `[Email] ❌ Failed to send email to ${options.email}:`,
      error.message
    );

    if (process.env.NODE_ENV === "development") {
      logCodeFallback(options, "Email sending failed");
    }

    throw error;
  }
};

export default sendEmail;
