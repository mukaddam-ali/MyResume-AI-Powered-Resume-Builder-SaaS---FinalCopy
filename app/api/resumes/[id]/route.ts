import { createRouteClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

const MAX_RESUME_BYTES = 1024 * 1024; // 1 MB per resume (photos are base64 inside data)

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
        return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
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

    let body: { name?: unknown; data?: unknown };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { name, data } = body;

    if (name !== undefined && typeof name !== 'string') {
        return NextResponse.json({ error: 'name must be a string' }, { status: 400 });
    }
    if (data !== undefined && (typeof data !== 'object' || data === null)) {
        return NextResponse.json({ error: 'data must be an object' }, { status: 400 });
    }
    if (data !== undefined && JSON.stringify(data).length > MAX_RESUME_BYTES) {
        return NextResponse.json({ error: 'Resume too large (max 1 MB). Try a smaller photo.' }, { status: 413 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (data !== undefined) updateData.data = data;
    updateData.last_modified = new Date().toISOString();

    // Match on the resume ID stored inside the JSON `data` column, not the
    // Supabase row UUID. `.select('id')` is essential: without it a zero-row
    // update returns success and the client never knows the resume doesn't
    // exist in the cloud yet (which is how resumes silently failed to sync).
    const { data: updated, error } = await supabase
        .from('resumes')
        .update(updateData)
        .eq('data->>id', id)
        .eq('user_id', user.id)
        .select('id');

    if (error) {
        console.error('Resume update error:', error.message);
        return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 });
    }

    if (!updated || updated.length === 0) {
        return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
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

    const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('data->>id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Resume delete error:', error.message);
        return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
