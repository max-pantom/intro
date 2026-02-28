import { sql } from "@vercel/postgres"

function hasPostgresConfig() {
  return Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL)
}

function ensurePostgresEnvAlias() {
  if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
    process.env.POSTGRES_URL = process.env.DATABASE_URL
  }
}

export async function ensureStartEmailLogTable() {
  if (!hasPostgresConfig()) return false

  ensurePostgresEnvAlias()
  await sql`
    CREATE TABLE IF NOT EXISTS start_email_log (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      first_name TEXT,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_by TEXT,
      status TEXT NOT NULL DEFAULT 'sent'
    )
  `
  return true
}

export type StartEmailLogEntry = {
  id: number
  email: string
  firstName: string | null
  sentAt: Date
  sentBy: string | null
  status: string
}

export async function insertStartEmailLog(params: {
  email: string
  firstName?: string | null
  sentBy?: string | null
  status?: "sent" | "failed"
}): Promise<boolean> {
  if (!hasPostgresConfig()) return false

  try {
    ensurePostgresEnvAlias()
    await ensureStartEmailLogTable()
    await sql`
      INSERT INTO start_email_log (email, first_name, sent_by, status)
      VALUES (
        ${params.email},
        ${params.firstName ?? null},
        ${params.sentBy ?? "admin"},
        ${params.status ?? "sent"}
      )
    `
    return true
  } catch {
    return false
  }
}
