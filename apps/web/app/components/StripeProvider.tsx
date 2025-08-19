'use client'

import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { ReactNode } from 'react'

// Stripe publishable key - Live mode
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51R51nZBIe5afQs21L7txvoeKgsaSSSXoSPCS0ySmjAPZ53b99e4igzVINTo1bG6nG5O2NW7lYFc6RZ5UApbFV3e600XVToAiAu')

interface StripeProviderProps {
  children: ReactNode
}

export function StripeProvider({ children }: StripeProviderProps) {
  return (
    <Elements 
      stripe={stripePromise}
      options={{
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            borderRadius: '8px'
          }
        },
        locale: 'pt-BR'
      }}
    >
      {children}
    </Elements>
  )
}