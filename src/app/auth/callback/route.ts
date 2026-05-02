import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        const meta = data.user.user_metadata ?? {}
        const emailBase = data.user.email?.split('@')[0] ?? 'user'
        const username =
          (meta.user_name ?? meta.preferred_username ?? emailBase)
            .replace(/[^a-z0-9]/gi, '')
            .toLowerCase() +
          '_' +
          Math.floor(Math.random() * 1000)

        const displayName =
          meta.full_name ?? meta.name ?? emailBase

        await supabase.from('profiles').insert({
          id: data.user.id,
          username,
          display_name: displayName,
          avatar_url: meta.avatar_url ?? null,
        })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
