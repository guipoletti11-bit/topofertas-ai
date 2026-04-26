import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PRO_ROUTES = ['/feed/unlimited', '/alertas', '/filtros']
const VIP_ROUTES = ['/historico', '/score', '/vip']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const needsPro = PRO_ROUTES.some(r => pathname.startsWith(r))
  const needsVip = VIP_ROUTES.some(r => pathname.startsWith(r))

  if (!needsPro && !needsVip) return NextResponse.next()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const token = req.cookies.get('sb-access-token')?.value
  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_active')
    .eq('id', user.id)
    .single()

  if (!profile?.plan_active) {
    return NextResponse.redirect(new URL('/planos?motivo=inativo', req.url))
  }

  if (needsVip && profile.plan !== 'vip') {
    return NextResponse.redirect(new URL('/planos?motivo=vip', req.url))
  }

  if (needsPro && !['pro', 'vip'].includes(profile.plan)) {
    return NextResponse.redirect(new URL('/planos?motivo=pro', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/feed/unlimited/:path*', '/alertas/:path*', '/filtros/:path*', '/historico/:path*', '/score/:path*', '/vip/:path*'],
}