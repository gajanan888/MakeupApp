import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

let transporter = null;

if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
} else {
  console.warn(
    "[EMAIL SERVICE] Warning: EMAIL_USER and EMAIL_PASS are not configured in .env. Falling back to log-only mock mode."
  );
}

/**
 * Sends a verification OTP email using Gmail SMTP.
 * @param {string} email Recipient's email address
 * @param {string} name Recipient's name
 * @param {string} code 6-digit OTP verification code
 */
export const sendVerificationEmail = async (email, name, code) => {
  const subject = "Verify your Artist Account - MakeupApp";
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #ff4081; text-align: center;">Welcome to MakeupApp!</h2>
      <p>Hi ${name || "there"},</p>
      <p>Thank you for registering as an <strong>Artist</strong>. To complete your signup and activate your account, please verify your email address using the 6-digit OTP code below:</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; text-align: center; border-radius: 6px; margin: 25px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #333;">${code}</span>
      </div>
      
      <p style="font-size: 13px; color: #666; margin-top: 25px;">This verification code is valid for 15 minutes. If you did not request this account registration, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">MakeupApp team &bull; Modern Beauty Bookings</p>
    </div>
  `;

  if (!transporter) {
    console.log(`
============================================================
[MOCK EMAIL SERVICE (No SMTP Configured)]
From: ${EMAIL_USER || "mock-sender@gmail.com"}
To: ${email}
Subject: ${subject}
OTP Code: ${code}
============================================================
    `);
    return { success: true, mock: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"MakeupApp" <${EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });
    return { success: true, data: info };
  } catch (error) {
    console.error("[EMAIL SERVICE] Error sending email via SMTP:", error);
    throw error;
  }
};
