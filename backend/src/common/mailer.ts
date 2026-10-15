import { promises as dns } from 'dns';
import * as nodemailer from 'nodemailer';

// Lazily built and cached — reading env vars at import time would freeze
// them before dotenv/config (loaded in main.ts) has a chance to run in
// some startup orders (e.g. tests), so this waits until the first send.
let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
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

  // Resolve through the OS resolver (dns.lookup) rather than letting
  // nodemailer query DNS servers directly: on machines whose configured DNS
  // server is unreachable (e.g. 127.0.0.1 left behind by a VPN/DNS tool),
  // nodemailer's own resolution hung forever and no email was ever sent.
  // servername keeps TLS certificate checks against the real hostname.
  const { address } = await dns.lookup(host, { family: 4 });

  transporter = nodemailer.createTransport({
    host: address,
    port,
    // 465 is SMTPS (implicit TLS); 587 (and anything else) uses STARTTLS.
    secure: port === 465,
    tls: { servername: host },
    // Fail instead of hanging when the mail server can't be reached.
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
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

  await (
    await getTransporter()
  ).sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}
