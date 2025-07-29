import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getReceiptDetails } from '@/app/actions/receipts'

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let receipt
  
  try {
    const result = await getReceiptDetails(id)
    receipt = result.receipt
  } catch (error) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-semibold text-gray-900">Receipt Details</h1>
            <Link
              href="/dashboard"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Receipt ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{receipt.id}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(receipt.createdAt).toLocaleDateString()}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Sender</dt>
                  <dd className="mt-1 text-sm text-gray-900">{receipt.senderName || 'Unknown'}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Amount</dt>
                  <dd className="mt-1 text-sm text-gray-900">${receipt.amount}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      receipt.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {receipt.status}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Bank Account</dt>
                  <dd className="mt-1 text-sm text-gray-900">{receipt.bankAccountId}</dd>
                </div>

                {receipt.remittanceInfo && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Remittance Info</dt>
                    <dd className="mt-1 text-sm text-gray-900">{receipt.remittanceInfo}</dd>
                  </div>
                )}

                {receipt.policyNumbers && receipt.policyNumbers.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Policy Numbers</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {receipt.policyNumbers.join(', ')}
                    </dd>
                  </div>
                )}

                {receipt.insuredNames && receipt.insuredNames.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Insured Names</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {receipt.insuredNames.join(', ')}
                    </dd>
                  </div>
                )}

                {receipt.documentUrl && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Document</dt>
                    <dd className="mt-1">
                      <a
                        href={receipt.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        View Document
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}