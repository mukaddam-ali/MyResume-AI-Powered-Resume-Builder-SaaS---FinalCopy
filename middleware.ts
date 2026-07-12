import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Skip middleware for API routes — they handle their own auth
    const { pathname } = request.nextUrl;
    if (pathname.startsWith('/api/')) {
        return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Skip auth refresh if Supabase isn't configured
    if (!supabaseUrl || !supabaseKey) {
        return supabaseResponse;
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                );
                supabaseResponse = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                );
            },
        },
        global: {
            fetch: async (url, options) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout for auth calls in middleware
                try {
                    const res = await fetch(url, {
                        ...options,
                        signal: controller.signal,
                    });
                    clearTimeout(timeoutId);
                    return res;
                } catch (err) {
                    clearTimeout(timeoutId);
                    // Return a mock offline response to silence raw console TypeError
                    return new Response(
                      JSON.stringify({
                        error: 'service_unavailable',
                        error_description: 'Supabase server is unreachable or request timed out.'
                      }),
                      {
                        status: 400,
                        statusText: 'Bad Request',
                        headers: { 'Content-Type': 'application/json' }
                      }
                    );
                }
            }
        }
    });

    // Refresh user session — the client's fetch wrapper above enforces a
    // 2s timeout so a slow/offline Supabase doesn't block page loads
    try {
        await supabase.auth.getUser();
    } catch (error: any) {
        // Network errors or aborted fetches are expected in dev/offline mode
        if (error?.name !== 'AbortError') {
            console.warn('[Middleware] Supabase auth check failed (network may be down)');
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match page routes only — skip static assets, API routes, and internal Next.js paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf)$).*)',
    ],
}
