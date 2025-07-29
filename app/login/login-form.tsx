'use client'

import { useState, useActionState } from 'react'
import { sendOtpAction, verifyOtpAction } from '@/app/actions/auth'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  
  const [sendState, sendAction, sendPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await sendOtpAction(formData)
      if (result.success) {
        setStep('otp')
        return null
      }
      return result
    },
    null
  )

  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyOtpAction,
    null
  )

  if (step === 'email') {
    return (
      <form action={sendAction} className="mt-8 space-y-6">
        <input type="hidden" name="email" value={email} />
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {sendState?.error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{sendState.error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={sendPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {sendPending ? 'Sending...' : 'Send Login Code'}
        </button>
      </form>
    )
  }

  return (
    <form action={verifyAction} className="mt-8 space-y-6">
      <input type="hidden" name="email" value={email} />
      
      <div>
        <p className="text-sm text-gray-600 mb-4">
          We sent a code to <strong>{email}</strong>
        </p>
        <label htmlFor="otp" className="sr-only">
          One-time password
        </label>
        <input
          id="otp"
          name="otp"
          type="text"
          autoComplete="one-time-code"
          required
          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Enter 6-digit code"
          maxLength={6}
        />
      </div>

      {verifyState?.error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{verifyState.error}</p>
        </div>
      )}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={verifyPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {verifyPending ? 'Verifying...' : 'Verify & Sign In'}
        </button>
        
        <button
          type="button"
          onClick={() => setStep('email')}
          className="w-full text-sm text-indigo-600 hover:text-indigo-500"
        >
          Use a different email
        </button>
      </div>
    </form>
  )
}