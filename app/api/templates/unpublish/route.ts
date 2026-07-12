import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';

export async function DELETE(request: NextRequest) {
    const supabase = await createRouteClient();
    if (!supabase) {
        return NextResponse.json({ success: false, error: 'Not configured' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let resumeId: string | undefined;
    try {
        ({ resumeId } = await request.json());
    } catch {
        // handled below
    }
    if (!resumeId || typeof resumeId !== 'string') {
        return NextResponse.json({ success: false, error: 'Missing resumeId' }, { status: 400 });
    }

    // RLS guarantees only the owner's row can match; the explicit user_id
    // filter makes the intent obvious and the query index-friendly.
    const { error } = await supabase
        .from('public_templates')
        .delete()
        .eq('resume_id', resumeId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error unpublishing template:', error.message);
        return NextResponse.json({ success: false, error: 'Failed to unpublish template.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
