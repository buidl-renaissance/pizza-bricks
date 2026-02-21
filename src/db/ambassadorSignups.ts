import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './drizzle';
import { ambassadorSignups } from './schema';
import type { AmbassadorSignupStatus, ContributorRole } from './schema';

export type AmbassadorSignup = typeof ambassadorSignups.$inferSelect;

export async function insertAmbassadorSignup(data: {
  name: string;
  email: string;
  city?: string;
  role: ContributorRole;
  instagramHandle?: string;
  message?: string;
}): Promise<AmbassadorSignup> {
  const db = getDb();
  const id = uuidv4();
  const row = {
    id,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    city: data.city?.trim() || null,
    role: data.role,
    instagramHandle: data.instagramHandle?.trim() || null,
    message: data.message?.trim() || null,
    status: 'new' as AmbassadorSignupStatus,
    addedAsContributorId: null,
  };
  await db.insert(ambassadorSignups).values(row);
  const [inserted] = await db.select().from(ambassadorSignups).where(eq(ambassadorSignups.id, id)).limit(1);
  return inserted;
}

export async function listAmbassadorSignups(options?: {
  status?: AmbassadorSignupStatus;
  limit?: number;
}): Promise<AmbassadorSignup[]> {
  const db = getDb();
  const limit = options?.limit ?? 100;
  const base = db.select().from(ambassadorSignups).orderBy(desc(ambassadorSignups.createdAt));
  const rows = options?.status
    ? await base.where(eq(ambassadorSignups.status, options.status)).limit(limit)
    : await base.limit(limit);
  return rows;
}

export async function getAmbassadorSignupById(id: string): Promise<AmbassadorSignup | null> {
  const db = getDb();
  const [row] = await db.select().from(ambassadorSignups).where(eq(ambassadorSignups.id, id)).limit(1);
  return row ?? null;
}

export async function updateAmbassadorSignupStatus(
  id: string,
  status: AmbassadorSignupStatus,
  addedAsContributorId?: string
): Promise<AmbassadorSignup | null> {
  const db = getDb();
  await db
    .update(ambassadorSignups)
    .set({
      status,
      addedAsContributorId: addedAsContributorId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(ambassadorSignups.id, id));
  return getAmbassadorSignupById(id);
}
