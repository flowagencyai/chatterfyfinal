'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface PricingCardProps {
  planCode: string
  name: string
  price: string
  currency?: string
  interval?: string
  features: string[]
  highlighted?: boolean
  currentPlan?: boolean
}

export function PricingCard({ 
  planCode, 
  name, 
  price, 
  currency = 'R$', 
  interval = '/mês',
  features, 
  highlighted = false,
  currentPlan = false 
}: PricingCardProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    if (!session?.user?.email) {
      // Redirect to login
      window.location.href = '/auth/signin'
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/v1/user/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': session.user.id || '',
          'X-User-Id': session.user.id || ''
        },
        body: JSON.stringify({
          planCode,
          email: session.user.email,
          name: session.user.name
        })
      })

      const data = await response.json()

      if (data.success && data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl
      } else if (data.success && planCode === 'FREE') {
        // FREE plan upgrade successful
        window.location.reload()
      } else {
        throw new Error(data.error || 'Failed to process upgrade')
      }

    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Erro ao processar upgrade. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`relative rounded-2xl p-8 ${
      highlighted 
        ? 'border-2 border-blue-500 bg-blue-50' 
        : 'border border-gray-200 bg-white'
    }`}>
      {highlighted && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Recomendado
          </span>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900">{name}</h3>
        
        <div className="mt-4 flex items-baseline justify-center">
          <span className="text-4xl font-bold text-gray-900">
            {currency}{price}
          </span>
          {interval && (
            <span className="text-lg text-gray-500 ml-1">
              {interval}
            </span>
          )}
        </div>

        <ul className="mt-8 space-y-4 text-left">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg 
                className="h-5 w-5 text-green-500 mt-1 mr-3" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          {currentPlan ? (
            <div className="w-full py-3 px-6 rounded-lg bg-gray-100 text-gray-500 font-medium">
              Plano Atual
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                highlighted
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Processando...
                </span>
              ) : (
                planCode === 'FREE' ? 'Usar Grátis' : `Assinar ${name}`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}