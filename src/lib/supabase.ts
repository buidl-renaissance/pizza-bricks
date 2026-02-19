import { createClient } from "@supabase/supabase-js";

/**
 * Supabase table for landing signups. Run in Supabase SQL editor if using Option A:
 *
 * create table landing_signups (
 *   id uuid primary key default gen_random_uuid(),
 *   email text not null,
 *   type text not null check (type in ('early_access', 'pizzeria', 'city', 'unity_dev')),
 *   name text,
 *   city text,
 *   message text,
 *   created_at timestamptz default now()
 * );
 * alter table landing_signups enable row level security;
 * create policy "Allow anonymous insert" on landing_signups for insert to anon with check (true);
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export type SignupType = "early_access" | "pizzeria" | "city" | "unity_dev";

export interface LandingSignupInsert {
  email: string;
  type: SignupType;
  name?: string;
  city?: string;
  message?: string;
}
