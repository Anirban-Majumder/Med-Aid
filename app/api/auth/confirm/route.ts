import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Creating a handler for a GET request to route /auth/confirm
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = '/SetUp'

  // Create redirect link without the secret token
  const redirectTo = new URL(next, request.url)
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')
  redirectTo.searchParams.delete('code')
  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const userId = data?.user.id
      const profileResponse = await supabase.from('profiles').select('*').eq('user_id', userId).single()
      if (profileResponse.error) {
        redirectTo.searchParams.delete('next')
        return NextResponse.redirect(redirectTo)
      } else {
        const next = '/Dashboard'
        const redirectTo = new URL(next, request.url)
        redirectTo.searchParams.delete('token_hash')
        redirectTo.searchParams.delete('type')
        redirectTo.searchParams.delete('code')
        redirectTo.searchParams.delete('next')
        return NextResponse.redirect(redirectTo)
      }
    }
  }

  // On error, return the user to an error page
  redirectTo.pathname = '/error'
  return NextResponse.redirect(redirectTo)
}