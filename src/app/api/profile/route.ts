import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { display_name, bio, username } = await request.json()

  if (username) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...(display_name !== undefined && { display_name }),
      ...(bio !== undefined && { bio }),
      ...(username !== undefined && { username }),
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
