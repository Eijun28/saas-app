'use server'

export async function createCheckoutSession(planType: 'premium' | 'pro') {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planType }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de la création de la session')
    }

    const data = await response.json()
    return { success: true, url: data.url, sessionId: data.sessionId }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function cancelSubscription() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/stripe/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de l\'annulation')
    }

    const data = await response.json()
    return { success: true, ...data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
