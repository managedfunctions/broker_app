import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getSessionUser, verifySessionToken } from '@/lib/auth';
import { getCloudflareContext } from '@opennextjs/cloudflare';


export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const sessionId = await verifySessionToken(token);
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get environment bindings from Cloudflare context
    const { env } = await getCloudflareContext();
    const db = getDb(env.BROKER_DB);

    const result = await getSessionUser(db, sessionId);

    if (!result) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        company: result.user.company,
        role: result.user.role,
      }
    });
  } catch (error) {
    console.error('Error in me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}