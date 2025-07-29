import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSessionUser, verifySessionToken } from '@/lib/auth';
import { getDb } from '@/db';
import { userReceipts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Check if user has access to this receipt
    const access = await db
      .select()
      .from(userReceipts)
      .where(
        and(
          eq(userReceipts.userId, result.user.id),
          eq(userReceipts.receiptId, id)
        )
      )
      .limit(1);

    if (access.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get hyperdrive connection
    const hyperdrive = env.HYPERDRIVE;
    const conn = hyperdrive.connectionString;
    
    // Import pg dynamically
    const { Client } = await import('pg');
    
    const client = new Client(conn);

    await client.connect();

    try {
      // Get full receipt details
      const result = await client.query(
        `SELECT id, bank_account_id, status, amount_cents, created_at, sender_name,
                remittance_info, policy_numbers, insured_names, amount_received_cents,
                difference_cents, document_url
         FROM receipts 
         WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
      }

      const row = result.rows[0];
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
        totalAllocated: '0.00', // Calculate from allocations if needed
        difference: row.amount_cents ? (row.amount_cents / 100).toFixed(2) : '0.00'
      };

      return NextResponse.json({ receipt });
    } finally {
      await client.end();
    }
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500 });
  }
}