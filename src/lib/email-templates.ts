/**
 * Small, dependency-free email templates for budget alerts.
 * Kept plain HTML + plain text (no MJML / react-email) so the server bundle stays lean.
 */

export type TemplateArgs = {
  userName: string | null;
  categoryName: string;
  threshold: 80 | 100;
  monthYear: string; // "YYYY-MM"
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const monthLabel = (my: string): string => {
  const [y, m] = my.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

export function subjectFor(threshold: 80 | 100, categoryName: string): string {
  return threshold === 100
    ? `⚠️ You've gone over budget for ${categoryName}`
    : `Heads up — ${categoryName} is at 80% of your monthly budget`;
}

export function render80TemplateText({
  userName,
  categoryName,
  threshold,
  monthYear,
}: TemplateArgs): string {
  const greeting = userName ? `Hi ${userName},` : "Hi there,";
  const status =
    threshold === 100
      ? `you've spent 100% (or more) of your budget for ${categoryName} in ${monthLabel(monthYear)}.`
      : `you've used 80% of your budget for ${categoryName} in ${monthLabel(monthYear)}.`;
  return [
    greeting,
    "",
    status,
    "",
    "Open Paisa to review your spending or adjust the limit:",
    "https://paisa.app/budgets",
    "",
    "— Paisa",
  ].join("\n");
}

export function render80TemplateHTML({
  userName,
  categoryName,
  threshold,
  monthYear,
}: TemplateArgs): string {
  const greeting = userName ? `Hi ${escapeHtml(userName)},` : "Hi there,";
  const cat = escapeHtml(categoryName);
  const isOver = threshold === 100;
  const badge = isOver ? "Over budget" : "80% used";
  const color = isOver ? "#dc2626" : "#d97706";
  const label = monthLabel(monthYear);

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5f7f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <tr>
        <td style="padding:20px 24px;background:linear-gradient(135deg,#059669,#10b981);color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.85;">Paisa • Budget alert</div>
          <div style="margin-top:6px;font-size:22px;font-weight:600;">${cat}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 12px;">${greeting}</p>
          <p style="margin:0 0 14px;">
            You've triggered a
            <span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;background:${color}1a;color:${color};">${badge}</span>
            alert for <strong>${cat}</strong> in ${escapeHtml(label)}.
          </p>
          <p style="margin:0 0 22px;color:#4b5563;font-size:14px;">
            Log in to Paisa to review recent transactions or adjust your monthly limit.
          </p>
          <a href="https://paisa.app/budgets" style="display:inline-block;padding:10px 18px;background:#059669;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
            Open Paisa
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;background:#f9fafb;color:#9ca3af;font-size:12px;">
          You're getting this because you have budget alerts enabled. Manage preferences in Settings.
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
