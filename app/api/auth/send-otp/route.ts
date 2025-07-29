import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createOTP, sendOTP } from '@/lib/auth';
import { getCloudflareContext } from '@opennextjs/cloudflare';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: string };
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get environment bindings from Cloudflare context
    const { env } = await getCloudflareContext();
    const db = getDb(env.BROKER_DB);
    const resend = new Resend(env.RESEND_API_KEY);

    // Check if user exists, if not create them
    let user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (user.length === 0) {
      // Create new user
      await db.insert(users).values({ email });
    }

    // Generate and save OTP
    const otp = await createOTP(db, email);

    // Send OTP email
    const result = await sendOTP(resend, email, otp);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in send-otp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}