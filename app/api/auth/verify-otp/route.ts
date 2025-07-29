import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyOTP, createSession, createSessionToken } from '@/lib/auth';
import { getCloudflareContext } from '@opennextjs/cloudflare';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: string; code?: string };
    const { email, code } = body;

    if (!email || !code || typeof email !== 'string' || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid email or code' },
        { status: 400 }
      );
    }

    // Get environment bindings from Cloudflare context
    const { env } = await getCloudflareContext();
    const db = getDb(env.BROKER_DB);

    // Verify OTP
    const isValid = await verifyOTP(db, email, code);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 401 }
      );
    }

    // Get user
    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult[0];

    // Create session
    const sessionId = await createSession(db, user.id);
    const token = await createSessionToken(sessionId);

    // Set cookie
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
      }
    });

    response.cookies.set('session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}