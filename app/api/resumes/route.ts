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

    const body = await request.json();
    const { name, data } = body;

    if (!name || !data) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ resume });
}
