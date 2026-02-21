/**
 * DB helpers for Vendor Outreach (outreach_emails, email_replies).
 * Used by Resend inbound webhook to match replies to sent outreach.
 */

import { eq, and, desc, isNotNull, inArray, sql } from 'drizzle-orm';
import { getDb } from './drizzle';
import { outreachEmails, emailReplies, vendors } from './schema';

export type OutreachEmailRow = typeof outreachEmails.$inferSelect;

/** Latest delivery status per vendor (for UI). */
export type LatestDeliveryByVendor = Record<
  string,
  { deliveryStatus: string; deliveryStatusAt: Date | null } | undefined
>;

/**
 * Get the latest sent outreach email's delivery status per vendor.
 * Used by search-vendors to show "Sent" / "Delivered" / "Bounced" in the UI.
 */
export async function getLatestOutreachDeliveryByVendorIds(
  vendorIds: string[]
): Promise<LatestDeliveryByVendor> {
  if (vendorIds.length === 0) return {};
  const db = getDb();
  const rows = await db
    .select({
      vendorId: outreachEmails.vendorId,
      deliveryStatus: outreachEmails.deliveryStatus,
      deliveryStatusAt: outreachEmails.deliveryStatusAt,
    })
    .from(outreachEmails)
    .where(
      and(eq(outreachEmails.status, 'sent'), inArray(outreachEmails.vendorId, vendorIds))
    )
    .orderBy(desc(outreachEmails.sentAt));
  const result: LatestDeliveryByVendor = {};
  for (const row of rows) {
    if (row.vendorId && !(row.vendorId in result)) {
      result[row.vendorId] = {
        deliveryStatus: row.deliveryStatus ?? 'sent',
        deliveryStatusAt: row.deliveryStatusAt ?? null,
      };
    }
  }
  return result;
}

/**
 * Find a sent outreach email that this inbound reply belongs to.
 * 1) If inReplyTo is present, match outreach_emails.sentRfcMessageId (normalize angle brackets).
 * 2) Else match by normalized from-address and subject against sent outreach_emails.
 */
export async function findOutreachEmailForInboundReply(opts: {
  from: string;
  subject: string;
  inReplyTo?: string | null;
}): Promise<OutreachEmailRow | undefined> {
  const db = getDb();
  const { from, subject, inReplyTo } = opts;
  const fromNormalized = from.toLowerCase().trim();

  if (inReplyTo) {
    const normalized = inReplyTo.replace(/^<|>$/g, '').trim().toLowerCase();
    const rows = await db
      .select()
      .from(outreachEmails)
      .where(
        and(
          eq(outreachEmails.status, 'sent'),
          isNotNull(outreachEmails.sentRfcMessageId),
          sql`LOWER(TRIM(REPLACE(REPLACE(${outreachEmails.sentRfcMessageId}, '<', ''), '>', ''))) = ${normalized}`
        )
      )
      .orderBy(desc(outreachEmails.sentAt))
      .limit(1);
    if (rows[0]) return rows[0];
    // Fallback: LIKE match for sentRfcMessageId containing the id
    const likeRows = await db
      .select()
      .from(outreachEmails)
      .where(
        and(
          eq(outreachEmails.status, 'sent'),
          isNotNull(outreachEmails.sentRfcMessageId),
          sql`${outreachEmails.sentRfcMessageId} LIKE ${'%' + normalized + '%'}`
        )
      )
      .orderBy(desc(outreachEmails.sentAt))
      .limit(1);
    if (likeRows[0]) return likeRows[0];
  }

  // Match by vendor email (from) and subject: find vendors with this email, then sent outreach with matching subject
  const subjStripped = subject.replace(/^re:\s*/i, '').trim().toLowerCase();
  const vendorRows = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(sql`LOWER(TRIM(${vendors.email})) = ${fromNormalized}`)
    .limit(5);
  for (const v of vendorRows) {
    const rows = await db
      .select()
      .from(outreachEmails)
      .where(
        and(
          eq(outreachEmails.vendorId, v.id),
          eq(outreachEmails.status, 'sent')
        )
      )
      .orderBy(desc(outreachEmails.sentAt))
      .limit(5);
    for (const row of rows) {
      const rowSubj = (row.subject ?? '').toLowerCase();
      if (subjStripped.includes(rowSubj) || rowSubj.includes(subjStripped)) return row;
    }
    if (rows[0]) return rows[0];
  }
  return undefined;
}
