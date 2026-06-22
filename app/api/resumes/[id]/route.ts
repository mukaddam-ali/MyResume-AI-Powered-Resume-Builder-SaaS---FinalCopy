import { createRouteClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// GET /api/resumes/[id] - Fetch single resume
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const supabase = await createRouteClient();
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: resume, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ resume });
}

// PUT /api/resumes/[id] - Update resume (id = local resume data id, stored inside JSON column)
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

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

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (data !== undefined) updateData.data = data;
    updateData.last_modified = new Date().toISOString();

    // Match on the resume ID stored inside the JSON `data` column, not the Supabase row UUID
    const { error } = await supabase
        .from('resumes')
        .update(updateData)
        .eq('data->>id', id)
        .eq('user_id', user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

// DELETE /api/resumes/[id] - Delete resume (id = local resume data id, stored inside JSON column)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const supabase = await createRouteClient();
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Match on the resume ID stored inside the JSON `data` column, not the Supabase row UUID
    const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('data->>id', id)
        .eq('user_id', user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
