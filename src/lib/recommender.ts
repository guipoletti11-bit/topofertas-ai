import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function trackEvent(
  userId: string,
  offerId: string,
  eventType: 'view' | 'click' | 'like' | 'skip' | 'share'
) {
  await supabase
    .from('user_events')
    .insert({ user_id: userId, offer_id: offerId, event_type: eventType })
}

export async function getUserProfile(userId: string) {
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export async function getRecommendations(userId: string, limit = 20) {
  const profile = await getUserProfile(userId)

  if (!profile || profile.confidence_score < 10) {
    const { data } = await supabase
      .from('offers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data ?? []
  }

  const weights: Record<string, number> = profile.category_weights ?? {}
  const total = Object.values(weights).reduce((a, b) => a + Math.max(0, b as number), 0)

  const { data: offers } = await supabase
    .from('offers')
    .select('*')
    .eq('is_active', true)

  if (!offers) return []

  const scored = offers.map((offer: any) => {
    const catWeight = total > 0 ? Math.max(0, weights[offer.category] ?? 0) / total : 0
    const offerScore = (offer.discount_percent ?? 0) / 100
    const finalScore = catWeight * 0.6 + offerScore * 0.4
    return { ...offer, finalScore }
  })

  return scored
    .sort((a: any, b: any) => b.finalScore - a.finalScore)
    .slice(0, limit)
}