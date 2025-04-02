import { useState } from "react"

export default function Cancel() {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = () => {
    setIsRetrying(true)
    setTimeout(() => {
      window.location.href = "/reservation"
    }, 1500)
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        
        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">Payment Failed</h2>
        
        <p className="mb-6 text-center text-gray-500">
          We couldn't process your payment. Please try again or use a different payment method.
        </p>
        
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Details</h3>
              <div className="mt-1 text-sm text-red-700">
                Your payment was declined. Please check your payment details and try again.
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isRetrying ? "Redirecting..." : "Try Again"}
          </button>
          
          <button 
            onClick={() => window.location.href = "/"}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  )
}
