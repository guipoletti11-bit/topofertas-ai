import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { ensureAffiliateUrl } from '@/lib/affiliate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const offerId = searchParams.get('id')
  const userId = searchParams.get('uid')

  if (!offerId) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { data: offer } = await supabase
    .from('offers')
    .select('affiliate_url, platform, title')
    .eq('id', offerId)
    .single()

  if (!offer) return NextResponse.json({ error: 'Oferta não encontrada' }, { status: 404 })

  const affiliateUrl = ensureAffiliateUrl(offer)

  await supabase.from('user_events').insert({
    user_id: userId ?? null,
    offer_id: offerId,
    event_type: 'click',
  })

  return NextResponse.redirect(affiliateUrl, { status: 302 })
}