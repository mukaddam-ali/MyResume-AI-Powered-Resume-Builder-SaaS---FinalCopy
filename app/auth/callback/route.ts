import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin

    if (code) {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(`${origin}/dashboard`)
        } else {
            console.error('exchangeCodeForSession error:', error)
            return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message || 'unknown_auth_error')}`)
        }
    }

    // Return to homepage if there's no code or another error
    const errorParam = requestUrl.searchParams.get('error') || 'unknown';
    const errorDescription = requestUrl.searchParams.get('error_description') || 'no_code_provided';
    return NextResponse.redirect(`${origin}/?error=${errorParam}&error_desc=${errorDescription}`)
}
