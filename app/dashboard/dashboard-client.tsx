'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { logoutAction } from '@/app/actions/auth'
import { getReceiptDetails } from '@/app/actions/receipts'

interface Receipt {
  id: string
  bankAccountId: string
  status: string
  amount: string
  amountCents: number
  createdAt: string
  senderName: string | null
}

interface ReceiptDetail extends Receipt {
  remittanceInfo?: string
  policyNumbers?: string[]
  insuredNames?: string[]
  documentUrl?: string
}

interface User {
  id: number
  email: string
  name: string | null
  company: string | null
  role: string | null
}

interface DashboardClientProps {
  user: User
  initialReceipts: Receipt[]
  selectedReceiptId?: string
  initialReceiptDetail?: ReceiptDetail | null
}

export default function DashboardClient({ user, initialReceipts, selectedReceiptId, initialReceiptDetail }: DashboardClientProps) {
  const [receipts] = useState(initialReceipts)
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptDetail | null>(initialReceiptDetail || null)
  const [loadingReceipt, setLoadingReceipt] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const params = useParams()

  const filteredReceipts = receipts.filter(receipt => {
    const query = searchQuery.toLowerCase()
    return (
      receipt.senderName?.toLowerCase().includes(query) ||
      receipt.amount.toLowerCase().includes(query) ||
      receipt.id.toLowerCase().includes(query)
    )
  })

  const handleReceiptClick = async (receiptId: string) => {
    router.push(`/dashboard?receipt=${receiptId}`)
    setLoadingReceipt(true)
    try {
      const result = await getReceiptDetails(receiptId)
      setSelectedReceipt(result.receipt)
    } catch (error) {
      console.error('Failed to load receipt details:', error)
    } finally {
      setLoadingReceipt(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">{user.email}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6">
        <div className="flex h-[calc(100vh-144px)]">
          {/* Left side - Receipt list */}
          <div className="w-1/3 min-w-[400px] bg-white shadow-sm border-r border-gray-200 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search receipts..."
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredReceipts.length === 0 ? (
                <p className="text-gray-500 px-6 py-4">No receipts found.</p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredReceipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      onClick={() => handleReceiptClick(receipt.id)}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedReceiptId === receipt.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {receipt.senderName || 'Unknown Sender'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(receipt.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-semibold text-gray-900">
                            ${receipt.amount}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                            receipt.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {receipt.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Receipt details */}
          <div className="flex-1 bg-gray-50 overflow-hidden">
            {loadingReceipt ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading receipt details...</div>
              </div>
            ) : selectedReceipt ? (
              <div className="h-full overflow-y-auto bg-white m-6 rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Receipt Details</h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-md">paired ✓</span>
                </div>
                <div className="px-6 py-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedReceipt.senderName || 'Unknown Sender'}</h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">Receipt ID</span>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 font-medium">
                              {new Date(selectedReceipt.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-gray-900">{selectedReceipt.senderName || 'Unknown'}</span>
                          </div>
                          <button className="ml-auto text-blue-600 hover:text-blue-700 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy ID
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">{selectedReceipt.id}</div>
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <dt className="text-sm font-medium text-gray-600">Total Received</dt>
                          <dd className="mt-1 text-2xl font-semibold text-blue-600">${selectedReceipt.amount}</dd>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <dt className="text-sm font-medium text-gray-600">Total Allocated</dt>
                          <dd className="mt-1 text-2xl font-semibold text-gray-900">$0.00</dd>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4">
                          <dt className="text-sm font-medium text-gray-600">Difference</dt>
                          <dd className="mt-1 text-2xl font-semibold text-red-600">${selectedReceipt.amount}</dd>
                          <p className="text-xs text-red-600 mt-1">Receipt amount exceeds allocated amount</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          selectedReceipt.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedReceipt.status}
                        </span>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Bank Account</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedReceipt.bankAccountId}</dd>
                    </div>

                    {selectedReceipt.remittanceInfo && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Remittance Info</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedReceipt.remittanceInfo}</dd>
                      </div>
                    )}

                    {selectedReceipt.policyNumbers && selectedReceipt.policyNumbers.length > 0 && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Policy Numbers</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {selectedReceipt.policyNumbers.join(', ')}
                        </dd>
                      </div>
                    )}

                    {selectedReceipt.insuredNames && selectedReceipt.insuredNames.length > 0 && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Insured Names</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {selectedReceipt.insuredNames.join(', ')}
                        </dd>
                      </div>
                    )}

                    {selectedReceipt.documentUrl && (
                      <div className="sm:col-span-2">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <h3 className="text-sm font-medium text-gray-900">Remittance Document</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={selectedReceipt.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                              </a>
                              <button className="text-sm text-gray-600 hover:text-gray-900">Expand</button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{selectedReceipt.documentUrl}</p>
                        </div>
                      </div>
                    )}

                    {/* Remittance Lines */}
                    <div className="sm:col-span-2">
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-gray-900">Remittance Lines</h3>
                          <button className="text-sm text-gray-600 hover:text-gray-900">Hide matched lines</button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy Number</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insured Name</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Received</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Difference</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedReceipt.policyNumbers && selectedReceipt.policyNumbers.map((policyNumber, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-sm text-gray-900 flex items-center gap-1">
                                    {policyNumber}
                                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-900 flex items-center gap-1">
                                    {selectedReceipt.insuredNames?.[index] || 'Unknown'}
                                    <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-900 text-right">${selectedReceipt.amount}</td>
                                  <td className="px-3 py-2 text-sm text-red-600 text-right flex items-center justify-end gap-1">
                                    ${selectedReceipt.amount}
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Select a receipt</h3>
                  <p className="mt-1 text-sm text-gray-500">Choose a receipt from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}