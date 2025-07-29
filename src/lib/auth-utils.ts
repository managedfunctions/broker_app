import { nanoid } from 'nanoid';
import { SignJWT, jwtVerify } from 'jose';
import { getDb } from '@/db';
import { users, sessions, otps } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { Resend } from 'resend';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here'
);

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(resend: Resend, email: string, otp: string) {
  try {
    const data = await resend.emails.send({
      from: 'Broker App <onboarding@resend.dev>',
      to: email,
      subject: 'Your Login Code',
      html: `
        <h2>Your Login Code</h2>
        <p>Your one-time login code is:</p>
        <h1 style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return { success: false, error };
  }
}

export async function createOTP(db: ReturnType<typeof getDb>, email: string): Promise<string> {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  await db.insert(otps).values({
    email,
    code: otp,
    expiresAt,
  });

  return otp;
}

export async function verifyOTP(db: ReturnType<typeof getDb>, email: string, code: string): Promise<boolean> {
  const now = new Date().toISOString();
  
  const validOtp = await db
    .select()
    .from(otps)
    .where(
      and(
        eq(otps.email, email),
        eq(otps.code, code),
        eq(otps.used, false),
        gte(otps.expiresAt, now)
      )
    )
    .limit(1);

  if (validOtp.length === 0) {
    return false;
  }

  // Mark OTP as used
  await db
    .update(otps)
    .set({ used: true })
    .where(eq(otps.id, validOtp[0].id));

  return true;
}

export async function createSession(db: ReturnType<typeof getDb>, userId: number): Promise<string> {
  const sessionId = nanoid();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  return sessionId;
}

export async function createSessionToken(sessionId: string): Promise<string> {
  const jwt = await new SignJWT({ sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return jwt;
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.sessionId as string;
  } catch {
    return null;
  }
}

export async function getSessionUser(db: ReturnType<typeof getDb>, sessionId: string) {
  const now = new Date().toISOString();

  const result = await db
    .select({
      user: users,
      session: sessions,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.id, sessionId),
        gte(sessions.expiresAt, now)
      )
    )
    .limit(1);

  return result[0] || null;
}

export async function deleteSession(db: ReturnType<typeof getDb>, sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}