'use server'

// Activer un plan gratuitement (sans Stripe)
export async function activateFreePlan(planType: 'premium' | 'pro') {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/subscriptions/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planType }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de l\'activation du plan')
    }

    const data = await response.json()
    return { success: true, subscription: data.subscription, message: data.message }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Fonction Stripe (désactivée pour l'instant)
export async function createCheckoutSession(planType: 'premium' | 'pro') {
  // Pour l'instant, utiliser l'activation gratuite
  return activateFreePlan(planType)
  
  /* Code Stripe désactivé - à réactiver plus tard
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
  */
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
