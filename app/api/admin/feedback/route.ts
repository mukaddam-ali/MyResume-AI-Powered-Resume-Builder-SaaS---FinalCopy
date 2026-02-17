import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();

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
        );

        // Check authentication
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user?.email) {
            console.log('❌ No user email found in session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('✅ User email:', user.email);

        // Check whitelist
        const { data: whitelist, error: whitelistError } = await supabase
            .from('admin_whitelist')
            .select('email')
            .eq('email', user.email)
            .single();

        console.log('Whitelist result:', { whitelist, whitelistError });

        if (whitelistError || !whitelist) {
            console.log('❌ User not in whitelist or error:', whitelistError?.message);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch feedback
        const { data: feedback, error } = await supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching feedback:', error);
            return NextResponse.json(
                { error: 'Failed to fetch feedback' },
                { status: 500 }
            );
        }

        return NextResponse.json({ feedback });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const cookieStore = await cookies();

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
        );

        // Check authentication
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user?.email) {
            console.log('❌ No user email found in session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('✅ User email:', user.email);

        // Check whitelist
        const { data: whitelist, error: whitelistError } = await supabase
            .from('admin_whitelist')
            .select('email')
            .eq('email', user.email)
            .single();

        console.log('Whitelist result:', { whitelist, whitelistError });

        if (whitelistError || !whitelist) {
            console.log('❌ User not in whitelist or error:', whitelistError?.message);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get feedback ID from request
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Feedback ID required' }, { status: 400 });
        }

        // Delete feedback
        console.log('🗑️ Attempting to delete feedback with ID:', id);
        const { data, error, count } = await supabase
            .from('feedback')
            .delete()
            .eq('id', id)
            .select();

        console.log('Delete result:', { data, error, count });

        if (error) {
            console.error('❌ Error deleting feedback:', error);
            return NextResponse.json(
                { error: 'Failed to delete feedback' },
                { status: 500 }
            );
        }

        console.log('✅ Feedback deleted successfully');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
