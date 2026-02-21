/**
 * When a website finishes building (site becomes published), automatically draft and send
 * the outreach email to the vendor when the site was created from the outreach "Prepare" flow.
 */

import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/drizzle';
import { vendors, outreachEmails, type NewOutreachEmail } from '@/db/schema';
import {
  getProspect,
  updateProspectStage,
  insertActivityEvent,
} from '@/db/ops';
import { inferMenuItems, draftOutreachEmail, type MenuItem } from '@/lib/anthropic';
import { searchForMenuItems } from '@/lib/customSearch';
import { recordAgenticCost } from '@/lib/agentic-cost';
import { sendEmail, isGmailConfigured } from '@/lib/gmail';

export type TriggerResult = { sent: boolean; error?: string };

/**
 * After a site is published, if the prospect was created from outreach (has metadata.vendorId),
 * draft the outreach email with the site URL and send it automatically.
 * Returns { sent: true } on success, { sent: false, error? } otherwise.
 */
export async function triggerOutreachEmailForPublishedSite(
  prospectId: string,
  siteUrl: string
): Promise<TriggerResult> {
  if (!isGmailConfigured()) {
    return { sent: false, error: 'Gmail not configured' };
  }

  const prospect = await getProspect(prospectId);
  if (!prospect) return { sent: false, error: 'Prospect not found' };

  let meta: { vendorId?: string } = {};
  if (prospect.metadata) {
    try {
      meta = JSON.parse(prospect.metadata) as { vendorId?: string };
    } catch {
      /* ignore */
    }
  }
  const vendorId = meta.vendorId;
  if (!vendorId) return { sent: false }; // not from outreach flow, skip silently

  const db = getDb();
  let vendor = await db.select().from(vendors).where(eq(vendors.id, vendorId)).then((r) => r[0] ?? null);
  if (!vendor) return { sent: false, error: 'Vendor not found' };
  if (!vendor.email) return { sent: false, error: 'Vendor has no email' };

  try {
    // Fetch menu snippets if not already present
    if (!vendor.recentPosts) {
      const addressParts = vendor.address?.split(',').map((s) => s.trim()) || [];
      let city = process.env.OUTREACH_DEFAULT_LOCATION?.split(',')[0]?.trim() || 'Denver';
      if (addressParts.length >= 3) city = addressParts[1];
      else if (addressParts.length === 2) city = addressParts[0];

      const menuSnippets = await searchForMenuItems(vendor.name, city);
      if (menuSnippets.length > 0) {
        await db
          .update(vendors)
          .set({ recentPosts: JSON.stringify(menuSnippets), updatedAt: new Date() })
          .where(eq(vendors.id, vendorId));
        vendor = { ...vendor, recentPosts: JSON.stringify(menuSnippets) };
      }
    }

    let menuItems: MenuItem[] = [];
    if (vendor.menuItems) {
      try {
        const parsed = JSON.parse(vendor.menuItems) as MenuItem[];
        if (Array.isArray(parsed)) {
          menuItems = parsed.filter((item): item is MenuItem => item && typeof item.name === 'string' && typeof item.description === 'string');
        }
      } catch {
        /* re-infer below */
      }
    }
    if (menuItems.length === 0) {
      const menuResult = await inferMenuItems(vendor);
      menuItems = menuResult.menuItems;
      if (
        menuResult.usage &&
        (menuResult.usage.input_tokens > 0 || menuResult.usage.output_tokens > 0)
      ) {
        recordAgenticCost({
          operation: 'outreach_draft',
          model: 'claude-haiku-4-5-20251001',
          inputTokens: menuResult.usage.input_tokens,
          outputTokens: menuResult.usage.output_tokens,
          thinkingTokens: menuResult.usage.thinking_tokens,
        }).catch((err) =>
          console.error('[outreach-auto-send] recordAgenticCost menu_inference failed:', err)
        );
      }
      if (menuItems.length > 0) {
        await db
          .update(vendors)
          .set({ menuItems: JSON.stringify(menuItems), updatedAt: new Date() })
          .where(eq(vendors.id, vendorId));
      }
    }

    const draftResult = await draftOutreachEmail(vendor, menuItems, siteUrl);
    const { subject, bodyHtml } = draftResult;
    if (
      draftResult.usage &&
      (draftResult.usage.input_tokens > 0 || draftResult.usage.output_tokens > 0)
    ) {
      recordAgenticCost({
        operation: 'outreach_draft',
        model: 'claude-sonnet-4-5-20250929',
        inputTokens: draftResult.usage.input_tokens,
        outputTokens: draftResult.usage.output_tokens,
        thinkingTokens: draftResult.usage.thinking_tokens,
      }).catch((err) =>
        console.error('[outreach-auto-send] recordAgenticCost draft failed:', err)
      );
    }

    const emailId = uuid();
    await db.insert(outreachEmails).values({
      id: emailId,
      vendorId,
      subject,
      bodyHtml,
    } as NewOutreachEmail);

    const { messageId, threadId } = await sendEmail({
      to: vendor.email,
      subject,
      bodyHtml,
    });

    await db
      .update(outreachEmails)
      .set({
        status: 'sent',
        gmailMessageId: messageId,
        gmailThreadId: threadId,
        sentAt: new Date(),
      })
      .where(eq(outreachEmails.id, emailId));

    await db
      .update(vendors)
      .set({ status: 'contacted', updatedAt: new Date() })
      .where(eq(vendors.id, vendor.id));

    await updateProspectStage(prospectId, 'contacted');
    await insertActivityEvent({
      type: 'email_sent',
      prospectId,
      targetLabel: vendor.name,
      detail: `Outreach email sent automatically after site published (${siteUrl})`,
      status: 'completed',
      triggeredBy: 'system',
      metadata: { emailId, vendorId, siteUrl },
    });

    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[outreach-auto-send] error:', err);
    return { sent: false, error: message };
  }
}
