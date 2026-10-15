import { sendMail } from './mailer';

// Emails ALERT_EMAIL_TO when an ESP32 sensor enters an abnormal state
// (intrusion triggered, smoke detected, high temperature).
//
// Fire-and-forget: the ESP32's POST must not wait on (or fail because of)
// Gmail, so errors are only logged. Each alert type has a cooldown so a
// flickering laser or a reading hovering on a threshold can't flood the
// inbox — the dashboard/logs still record every transition.

const ALERT_COOLDOWN_MS = 60_000;

const lastSentAt = new Map<string, number>();

export function sendAlertEmail(
  alertType: string,
  subject: string,
  details: Record<string, string | number | null>,
): void {
  const to = process.env.ALERT_EMAIL_TO;

  if (!to) {
    return; // alert emails are opt-in via ALERT_EMAIL_TO
  }

  const now = Date.now();
  const last = lastSentAt.get(alertType);

  if (last != null && now - last < ALERT_COOLDOWN_MS) {
    console.log(`ALERT EMAIL SKIPPED (cooldown): ${alertType}`);
    return;
  }

  lastSentAt.set(alertType, now);

  const rows = Object.entries({
    Time: new Date(now).toLocaleString(),
    ...details,
  }).map(([label, value]) => [label, value ?? '—'] as const);

  const text = [
    subject,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ].join('\n');

  const html = `
    <h2 style="color:#b91c1c;margin:0 0 12px">${subject}</h2>
    <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="color:#64748b">${label}</td><td><strong>${value}</strong></td></tr>`,
        )
        .join('')}
    </table>
  `;

  sendMail({ to, subject: `[ALERT] ${subject}`, text, html })
    .then(() => console.log(`ALERT EMAIL SENT: ${alertType} -> ${to}`))
    .catch((error) => {
      // Let the next abnormal reading retry instead of waiting out the cooldown.
      lastSentAt.delete(alertType);
      console.error(`ALERT EMAIL FAILED: ${alertType}`, error);
    });
}
