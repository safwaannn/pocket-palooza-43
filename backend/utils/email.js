/**
 * ============================================================================
 * email.js — the one place that knows how to send email
 * ============================================================================
 *
 * Controllers call `sendEmail({ email, subject, message })` and know nothing
 * about nodemailer, SMTP hosts, or transports. Keeping this behind a single
 * function means swapping the provider (Mailtrap in dev, SendGrid/Resend in
 * prod) is a one-file change.
 *
 * All connection details come from environment variables — see config.env.
 */
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter — the object that actually talks to the mail server.
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define the email.
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Paisa <no-reply@paisa.app>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // optional HTML body
  };

  // 3) Send it. Any failure rejects — the caller decides how to handle it
  //    (e.g. forgotPassword rolls back the reset token).
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
