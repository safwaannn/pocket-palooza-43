// Server-only endpoint. POST /api/email-budget-alerts
//
// Finds every un-emailed budget alert, sends a delivery email via Resend, and marks the row
// as `emailed = true`. Idempotent — a follow-up call is a no-op unless new alerts appeared.
//
// Auth: expects `Authorization: Bearer <CRON_SECRET>` (matches env `CRON_SECRET`).
// Provider config: RESEND_API_KEY, PAISA_ALERTS_FROM. Missing either is a soft skip so the
// endpoint is safe to call in dev.

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/supabase/client.server";
import {
  render80TemplateHTML,
  render80TemplateText,
  subjectFor,
} from "@/lib/email-templates";

async function handle(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "POST" },
    });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.PAISA_ALERTS_FROM;
  if (!RESEND_API_KEY || !FROM) {
    return Response.json({ sent: 0, skipped: "email provider not configured" });
  }

  const { data: alerts, error } = await supabaseAdmin
    .from("budget_alerts")
    .select(
      "id,user_id,category_id,month_year,threshold,created_at, categories(name)",
    )
    .eq("emailed", false)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
  if (!alerts?.length) return Response.json({ sent: 0 });

  const userIds = Array.from(new Set(alerts.map((a) => a.user_id)));
  const userMap = new Map<string, { email: string; name: string | null }>();
  for (const userId of userIds) {
    const { data: userInfo } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = userInfo.user?.email;
    if (!email) continue;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .maybeSingle();
    userMap.set(userId, { email, name: profile?.name ?? null });
  }

  let sent = 0;
  const emailed: string[] = [];

  for (const alert of alerts) {
    const target = userMap.get(alert.user_id);
    if (!target) continue;
    const categoryName =
      (alert.categories as { name?: string } | null)?.name ?? "your budget";
    const threshold = alert.threshold as 80 | 100;

    const body = {
      from: FROM,
      to: [target.email],
      subject: subjectFor(threshold, categoryName),
      text: render80TemplateText({
        userName: target.name,
        categoryName,
        threshold,
        monthYear: alert.month_year,
      }),
      html: render80TemplateHTML({
        userName: target.name,
        categoryName,
        threshold,
        monthYear: alert.month_year,
      }),
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Skip failures — the next call will retry them (emailed is still false).
      console.error("Failed to send alert email", await response.text());
      continue;
    }
    sent++;
    emailed.push(alert.id);
  }

  if (emailed.length) {
    const { error: updateErr } = await supabaseAdmin
      .from("budget_alerts")
      .update({ emailed: true })
      .in("id", emailed);
    if (updateErr) console.error("Failed to mark alerts as emailed", updateErr);
  }

  return Response.json({ sent });
}

export const Route = createFileRoute("/api/email-budget-alerts")({
  server: {
    handlers: {
      POST: ({ request }: { request: Request }) => handle(request),
    },
  },
});
