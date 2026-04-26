import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRODUCT_PLAN_MAP: Record<string, 'pro' | 'vip'> = {
  [process.env.CAKTO_PRODUCT_PRO_ID!]: 'pro',
  [process.env.CAKTO_PRODUCT_VIP_ID!]: 'vip',
}

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.CAKTO_WEBHOOK_SECRET!
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-cakto-signature') ?? ''

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const { type, data } = event

  await supabase.from('webhook_logs').insert({ event_type: type, payload: event })

  const email = data?.customer?.email
  if (!email) return NextResponse.json({ ok: true })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (!profile) return NextResponse.json({ ok: true })

  switch (type) {
    case 'purchase.confirmed': {
      const plan = PRODUCT_PLAN_MAP[data.product_id] ?? 'pro'
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1)
      await supabase.from('profiles').update({
        plan,
        plan_active: true,
        cakto_subscription_id: data.subscription_id,
        plan_expires_at: expiresAt.toISOString(),
        plan_updated_at: new Date().toISOString(),
      }).eq('id', profile.id)
      break
    }
    case 'subscription.canceled':
    case 'subscription.refunded': {
      await supabase.from('profiles').update({
        plan: 'free',
        plan_active: false,
        plan_updated_at: new Date().toISOString(),
      }).eq('id', profile.id)
      break
    }
    case 'subscription.renewed': {
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1)
      await supabase.from('profiles').update({
        plan_active: true,
        plan_expires_at: expiresAt.toISOString(),
        plan_updated_at: new Date().toISOString(),
      }).eq('id', profile.id)
      break
    }
  }

  return NextResponse.json({ ok: true })
}