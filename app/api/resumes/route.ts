import { createRouteClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// GET /api/resumes - Fetch all resumes for authenticated user
export async function GET() {
    const supabase = await createRouteClient();
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: resumes, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('last_modified', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ resumes });
}

// POST /api/resumes - Create new resume
export async function POST(request: Request) {
    const supabase = await createRouteClient();
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { name?: unknown; data?: unknown };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { name, data } = body;

    if (!name || typeof name !== 'string' || !data || typeof data !== 'object') {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (JSON.stringify(data).length > 1024 * 1024) {
        return NextResponse.json({ error: 'Resume too large (max 1 MB). Try a smaller photo.' }, { status: 413 });
    }

    // Upsert on (user_id, data->>id): a retried create must not duplicate rows
    const { data: resume, error } = await supabase
        .from('resumes')
        .insert({
            user_id: user.id,
            name,
            data,
        })
        .select()
        .single();

    if (error) {
        // 23505 = unique violation on (user_id, data->>id) — row already exists
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Resume already exists' }, { status: 409 });
        }
        console.error('Resume create error:', error.message);
        return NextResponse.json({ error: 'Failed to create resume' }, { status: 500 });
    }

    return NextResponse.json({ resume });
}
