'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { Resend } from 'resend'
import { getDb } from '@/db'
import { users, userReceipts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  createOTP,
  verifyOTP,
  sendOTP,
  createSession,
  createSessionToken,
  verifySessionToken,
  deleteSession,
} from '@/lib/auth'

export async function sendOtpAction(formData: FormData) {
  const email = formData.get('email') as string
  
  if (!email) {
    return { error: 'Email is required' }
  }

  const { env } = await getCloudflareContext()
  const db = getDb(env.BROKER_DB)

  // Check if user exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existingUser.length === 0) {
    return { error: 'No account found with this email' }
  }

  // Create OTP
  const otp = await createOTP(db, email)

  // Send OTP email
  const resend = new Resend(env.RESEND_API_KEY)
  const result = await sendOTP(resend, email, otp)

  if (!result.success) {
    return { error: 'Failed to send OTP' }
  }

  return { success: true }
}

export async function verifyOtpAction(formData: FormData) {
  const email = formData.get('email') as string
  const otp = formData.get('otp') as string

  if (!email || !otp) {
    return { error: 'Email and OTP are required' }
  }

  const { env } = await getCloudflareContext()
  const db = getDb(env.BROKER_DB)

  // Verify OTP
  const isValid = await verifyOTP(db, email, otp)
  if (!isValid) {
    return { error: 'Invalid or expired OTP' }
  }

  // Get user
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (user.length === 0) {
    return { error: 'User not found' }
  }

  // Create session
  const sessionId = await createSession(db, user[0].id)
  const token = await createSessionToken(sessionId)

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set('session-token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  redirect('/dashboard')
}

export async function logoutAction() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session-token')?.value

  if (token) {
    const sessionId = await verifySessionToken(token)
    if (sessionId) {
      const { env } = await getCloudflareContext()
      const db = getDb(env.BROKER_DB)
      await deleteSession(db, sessionId)
    }
  }

  cookieStore.delete('session-token')
  redirect('/login')
}