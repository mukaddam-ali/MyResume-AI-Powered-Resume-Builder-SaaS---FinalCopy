import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';
import { ResumeData } from '@/store/useResumeStore';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { getUserAndTier } from '@/lib/entitlements-server';

const MAX_TEMPLATE_BYTES = 2 * 1024 * 1024; // 2 MB — portfolio project images live in the JSON

/**
 * Strip internal state before a resume is shared publicly. Contact details
 * and photo are KEPT — they power the public portfolio page the user is
 * deliberately publishing. The community gallery API re-sanitizes its own
 * output and never exposes them.
 */
function sanitizeForPublishing(resumeData: ResumeData, tier: 'free' | 'pro'): ResumeData & { portfolioTier: string } {
    return {
        ...resumeData,
        analysisResult: null,
        variants: undefined,
        activeVariantId: null,
        // Owner's tier at publish time selects the portfolio design
        portfolioTier: tier,
    };
}

export async function POST(request: NextRequest) {
    const limit = rateLimit(`publish:${getClientIp(request)}`, 10, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit);

    const supabase = await createRouteClient();
    if (!supabase) {
        return NextResponse.json({ success: false, error: 'Not configured' }, { status: 503 });
    }

    // Publishing requires a real account — the row is owned by auth.uid()
    // and RLS enforces that only the owner can update or delete it.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json(
            { success: false, error: 'Sign in to publish your resume publicly.' },
            { status: 401 }
        );
    }

    let body: { resumeId?: string; resumeData?: ResumeData };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const { resumeId, resumeData } = body;
    if (!resumeId || typeof resumeId !== 'string' || !resumeData || typeof resumeData !== 'object') {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Owner's tier selects the portfolio design (pro gets the premium layout)
    const { tier } = await getUserAndTier();
    const sanitizedData = sanitizeForPublishing(resumeData, tier);

    if (JSON.stringify(sanitizedData).length > MAX_TEMPLATE_BYTES) {
        return NextResponse.json(
            { success: false, error: 'Resume is too large to publish.' },
            { status: 413 }
        );
    }

    const { error } = await supabase
        .from('public_templates')
        .upsert({
            resume_id: resumeId,
            user_id: user.id,
            resume_data: sanitizedData,
            resume_name: resumeData.name,
            template_type: resumeData.selectedTemplate,
            job_title: resumeData.personalInfo?.jobTitle || null,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'resume_id' });

    if (error) {
        console.error('Error publishing template:', error.message);
        // 42501 = RLS violation: someone else already published this resume_id
        const conflict = error.code === '42501';
        return NextResponse.json(
            { success: false, error: conflict ? 'You do not own this template.' : 'Failed to publish template.' },
            { status: conflict ? 403 : 500 }
        );
    }

    return NextResponse.json({ success: true });
}
