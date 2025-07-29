import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDb } from '@/db'
import { verifySessionToken, getSessionUser } from '@/lib/auth-utils'
import { getReceipts } from '@/app/actions/receipts'
import DashboardClient from './dashboard-client'

async function getUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session-token')?.value

  if (!token) {
    redirect('/login')
  }

  const sessionId = await verifySessionToken(token)
  if (!sessionId) {
    redirect('/login')
  }

  const { env } = await getCloudflareContext()
  const db = getDb(env.BROKER_DB)
  const result = await getSessionUser(db, sessionId)

  if (!result) {
    redirect('/login')
  }

  return result.user
}

export default async function DashboardPage() {
  const user = await getUser()
  const { receipts } = await getReceipts()

  return <DashboardClient user={user} initialReceipts={receipts} />
}