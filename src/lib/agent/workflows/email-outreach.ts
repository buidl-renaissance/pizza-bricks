import { Resend } from 'resend';
import {
  insertEmailLog,
  updateEmailLogStatus,
  insertActivityEvent,
  getEmailLogsByProspect,
  listProspects,
  touchProspect,
} from '@/db/ops';
import { getTemplate } from '@/lib/agent/email-templates';

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? 'eThembre <onboarding@resend.dev>';
const MAX_STEP = 1; // cold outreach only; follow-up runs separately

interface EmailConfig {
  emailEnabled: boolean;
  emailRatePerHour: number;
}

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function runEmailOutreach(config: EmailConfig): Promise<number> {
  if (!config.emailEnabled) return 0;

  const resend = getResend();
  // If no API key, skip gracefully
  if (!resend) {
    console.warn('[email-outreach] RESEND_API_KEY not set — skipping email outreach');
    return 0;
  }

  // Find discovered prospects that have not yet received any email
  const discovered = await listProspects({ stage: 'discovered', limit: config.emailRatePerHour });
  const eligible = discovered.filter(p => p.email);

  let sent = 0;
  for (const prospect of eligible) {
    // Check if already in sequence
    const existing = await getEmailLogsByProspect(prospect.id);
    if (existing.length > 0) continue;

    const template = getTemplate('cold_outreach_1');
    if (!template) continue;

    // Create log entry first
    const log = await insertEmailLog({
      prospectId: prospect.id,
      templateId: template.id,
      sequenceStep: template.sequenceStep,
      subject: template.subject,
      status: 'queued',
    });

    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: [prospect.email!],
        subject: template.subject,
        html: template.html({ name: prospect.name, contactName: prospect.contactName ?? undefined }),
        text: template.text({ name: prospect.name, contactName: prospect.contactName ?? undefined }),
      });

      await updateEmailLogStatus(log.id, 'sent', { sentAt: new Date() });
      await touchProspect(prospect.id);

      await insertActivityEvent({
        type: 'email_sent',
        prospectId: prospect.id,
        targetLabel: prospect.name,
        detail: `Sent cold outreach email: "${template.subject}"`,
        status: 'completed',
        triggeredBy: 'agent',
      });

      sent++;
    } catch (err) {
      await updateEmailLogStatus(log.id, 'failed');
      await insertActivityEvent({
        type: 'agent_error',
        prospectId: prospect.id,
        targetLabel: prospect.name,
        detail: `Email send failed: ${err instanceof Error ? err.message : String(err)}`,
        status: 'failed',
        triggeredBy: 'agent',
      });
    }
  }

  return sent;
}

export async function sendEmailToProspect(prospectId: string, templateId: string): Promise<void> {
  const resend = getResend();
  const { getProspect } = await import('@/db/ops');
  const prospect = await getProspect(prospectId);
  if (!prospect) throw new Error(`Prospect ${prospectId} not found`);
  if (!prospect.email) throw new Error(`Prospect ${prospect.name} has no email address`);

  const template = getTemplate(templateId);
  if (!template) throw new Error(`Template ${templateId} not found`);

  const log = await insertEmailLog({
    prospectId: prospect.id,
    templateId: template.id,
    sequenceStep: template.sequenceStep,
    subject: template.subject,
    status: 'queued',
  });

  if (!resend) {
    // Log as sent for dev purposes when no API key
    await updateEmailLogStatus(log.id, 'sent', { sentAt: new Date() });
    await insertActivityEvent({
      type: 'email_sent',
      prospectId: prospect.id,
      targetLabel: prospect.name,
      detail: `[DEV] Would have sent "${template.subject}" (no RESEND_API_KEY)`,
      status: 'completed',
      triggeredBy: 'manual',
    });
    return;
  }

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: [prospect.email],
    subject: template.subject,
    html: template.html({ name: prospect.name, contactName: prospect.contactName ?? undefined }),
    text: template.text({ name: prospect.name, contactName: prospect.contactName ?? undefined }),
  });

  await updateEmailLogStatus(log.id, 'sent', { sentAt: new Date() });
  await touchProspect(prospectId);

  await insertActivityEvent({
    type: 'email_sent',
    prospectId: prospect.id,
    targetLabel: prospect.name,
    detail: `Sent "${template.subject}"`,
    status: 'completed',
    triggeredBy: 'manual',
  });
}
