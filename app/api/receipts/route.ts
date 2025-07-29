import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSessionUser, verifySessionToken } from '@/lib/auth';
import { getDb } from '@/db';
import { userReceipts } from '@/db/schema';
import { eq } from 'drizzle-orm';


export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext();

  try {
    const token = request.cookies.get('session-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sessionId = await verifySessionToken(token);
    if (!sessionId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const db = getDb(env.BROKER_DB);
    const result = await getSessionUser(db, sessionId);
    if (!result) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Get receipt IDs for this user
    const userReceiptsList = await db
      .select()
      .from(userReceipts)
      .where(eq(userReceipts.userId, result.user.id));

    if (userReceiptsList.length === 0) {
      return NextResponse.json({ receipts: [] });
    }

    // Get hyperdrive connection
    const hyperdrive = env.HYPERDRIVE;
    const conn = hyperdrive.connectionString;
    
    // Import pg dynamically
    const { Client } = await import('pg');
    
    const client = new Client(conn);

    await client.connect();

    try {
      // Get receipt details from PostgreSQL
      const receiptIds = userReceiptsList.map(r => r.receiptId);
      const placeholders = receiptIds.map((_, i) => `$${i + 1}`).join(',');
      
      const result = await client.query(
        `SELECT id, bank_account_id, status, amount_cents, created_at, sender_name 
         FROM receipts 
         WHERE id IN (${placeholders})
         ORDER BY created_at DESC`,
        receiptIds
      );

      const receipts = result.rows.map(row => ({
        id: row.id,
        bankAccountId: row.bank_account_id,
        status: row.status,
        amountCents: row.amount_cents,
        amount: row.amount_cents ? (row.amount_cents / 100).toFixed(2) : '0.00',
        createdAt: row.created_at,
        senderName: row.sender_name
      }));

      return NextResponse.json({ receipts });
    } finally {
      await client.end();
    }
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });
  }
}