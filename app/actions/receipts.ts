'use server'

import { cookies } from 'next/headers'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDb } from '@/db'
import { userReceipts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifySessionToken, getSessionUser } from '@/lib/auth-utils'

async function requireAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session-token')?.value

  if (!token) {
    throw new Error('Not authenticated')
  }

  const sessionId = await verifySessionToken(token)
  if (!sessionId) {
    throw new Error('Invalid session')
  }

  const { env } = await getCloudflareContext()
  const db = getDb(env.BROKER_DB)
  const result = await getSessionUser(db, sessionId)

  if (!result) {
    throw new Error('Session expired')
  }

  return { user: result.user, db, env }
}

export async function getReceipts() {
  const { user, db, env } = await requireAuth()

  // Get receipt IDs for this user
  const userReceiptsList = await db
    .select()
    .from(userReceipts)
    .where(eq(userReceipts.userId, user.id))

  if (userReceiptsList.length === 0) {
    return { receipts: [] }
  }

  // Get hyperdrive connection
  const hyperdrive = env.HYPERDRIVE
  const conn = hyperdrive.connectionString

  // Import pg dynamically
  const { Client } = await import('pg')
  const client = new Client(conn)

  await client.connect()

  try {
    const receiptIds = userReceiptsList.map(r => r.receiptId)
    const placeholders = receiptIds.map((_, i) => `$${i + 1}`).join(',')
    
    const result = await client.query(
      `SELECT id, bank_account_id, status, amount_cents, created_at, sender_name 
       FROM receipts 
       WHERE id IN (${placeholders})
       ORDER BY created_at DESC`,
      receiptIds
    )

    const receipts = result.rows.map(row => ({
      id: row.id,
      bankAccountId: row.bank_account_id,
      status: row.status,
      amountCents: row.amount_cents,
      amount: row.amount_cents ? (row.amount_cents / 100).toFixed(2) : '0.00',
      createdAt: row.created_at,
      senderName: row.sender_name
    }))

    return { receipts }
  } finally {
    await client.end()
  }
}

export async function getReceiptDetails(receiptId: string) {
  const { user, db, env } = await requireAuth()

  // Check if user has access to this receipt
  const access = await db
    .select()
    .from(userReceipts)
    .where(
      eq(userReceipts.userId, user.id) &&
      eq(userReceipts.receiptId, receiptId)
    )
    .limit(1)

  if (access.length === 0) {
    throw new Error('Access denied')
  }

  // Get hyperdrive connection
  const hyperdrive = env.HYPERDRIVE
  const conn = hyperdrive.connectionString

  const { Client } = await import('pg')
  const client = new Client(conn)

  await client.connect()

  try {
    const result = await client.query(
      `SELECT id, bank_account_id, status, amount_cents, created_at, sender_name,
              remittance_info, policy_numbers, insured_names, amount_received_cents,
              difference_cents, document_url
       FROM receipts 
       WHERE id = $1`,
      [receiptId]
    )

    if (result.rows.length === 0) {
      throw new Error('Receipt not found')
    }

    const row = result.rows[0]
    const receipt = {
      id: row.id,
      bankAccountId: row.bank_account_id,
      status: row.status,
      amountCents: row.amount_cents,
      amount: row.amount_cents ? (row.amount_cents / 100).toFixed(2) : '0.00',
      createdAt: row.created_at,
      senderName: row.sender_name,
      remittanceInfo: row.remittance_info,
      policyNumbers: row.policy_numbers || [],
      insuredNames: row.insured_names || [],
      amountReceivedCents: row.amount_received_cents || [],
      differenceCents: row.difference_cents || [],
      documentUrl: row.document_url,
      totalAllocated: '0.00',
      difference: row.amount_cents ? (row.amount_cents / 100).toFixed(2) : '0.00'
    }

    return { receipt }
  } finally {
    await client.end()
  }
}