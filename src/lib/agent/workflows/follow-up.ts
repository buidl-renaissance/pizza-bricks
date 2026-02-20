import { getDb } from '@/db/drizzle';
import { emailLogs } from '@/db/schema';
import { eq, and, lt, isNull } from 'drizzle-orm';
import {
  insertEmailLog,
  updateEmailLogStatus,
  insertActivityEvent,
  getProspect,
  touchProspect,
} from '@/db/ops';
import { getTemplateByStep } from '@/lib/agent/email-templates';
import { Resend } from 'resend';

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? 'eThembre <onboarding@resend.dev>';

// Days to wait between sequence steps
const STEP_DELAYS_DAYS: Record<number, number> = {
  1: 3,  // 3 days after step 1 → send step 2
  2: 5,  // 5 days after step 2 → send step 3
};
const MAX_STEP = 3;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function runFollowUp(): Promise<number> {
  const db = getDb();
  let triggered = 0;

  for (const [currentStep, delayDays] of Object.entries(STEP_DELAYS_DAYS)) {
    const step = Number(currentStep);
    const nextStep = step + 1;
    if (nextStep > MAX_STEP) continue;

    const cutoff = daysAgo(delayDays);

    // Find logs at this step that were sent at least delayDays ago, status=sent/delivered/opened
    const overdueRows = await db.select().from(emailLogs).where(
      and(
        eq(emailLogs.sequenceStep, step),
        lt(emailLogs.sentAt, cutoff),
        isNull(emailLogs.repliedAt),
      )
    ).limit(20);

    const resend = getResend();

    for (const log of overdueRows) {
      if (!['sent', 'delivered', 'opened'].includes(log.status)) continue;

      // Check if next step already queued
      const existing = await db.select().from(emailLogs).where(
        and(
          eq(emailLogs.prospectId, log.prospectId),
          eq(emailLogs.sequenceStep, nextStep),
        )
      ).limit(1);
      if (existing.length > 0) continue;

      const prospect = await getProspect(log.prospectId);
      if (!prospect || !prospect.email) continue;

      const template = getTemplateByStep(nextStep);
      if (!template) continue;

      const newLog = await insertEmailLog({
        prospectId: log.prospectId,
        templateId: template.id,
        sequenceStep: template.sequenceStep,
        subject: template.subject,
        status: 'queued',
      });

      if (resend) {
        try {
          await resend.emails.send({
            from: FROM_ADDRESS,
            to: [prospect.email],
            subject: template.subject,
            html: template.html({ name: prospect.name, contactName: prospect.contactName ?? undefined }),
            text: template.text({ name: prospect.name, contactName: prospect.contactName ?? undefined }),
          });
          await updateEmailLogStatus(newLog.id, 'sent', { sentAt: new Date() });
        } catch {
          await updateEmailLogStatus(newLog.id, 'failed');
          continue;
        }
      } else {
        await updateEmailLogStatus(newLog.id, 'sent', { sentAt: new Date() });
      }

      await touchProspect(log.prospectId);

      await insertActivityEvent({
        type: 'follow_up_triggered',
        prospectId: log.prospectId,
        targetLabel: prospect.name,
        detail: `Sent follow-up step ${nextStep}: "${template.subject}"`,
        status: 'completed',
        triggeredBy: 'agent',
      });

      triggered++;
    }
  }

  return triggered;
}
