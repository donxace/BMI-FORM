import * as nodemailer from 'nodemailer';

// Lazily built and cached — reading env vars at import time would freeze
// them before dotenv/config (loaded in main.ts) has a chance to run in
// some startup orders (e.g. tests), so this waits until the first send.
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(
      'SMTP_USER/SMTP_PASS are not set — copy backend/.env.example and fill in the mail section to send password-reset emails.',
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    // 465 is SMTPS (implicit TLS); 587 (and anything else) uses STARTTLS.
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await getTransporter().sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}
