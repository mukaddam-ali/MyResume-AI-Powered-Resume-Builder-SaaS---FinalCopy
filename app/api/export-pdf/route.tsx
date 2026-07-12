import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@supabase/supabase-js';
import { ResumeDocument } from '@/components/preview/ResumeDocument';
import { registerServerFonts } from '@/lib/fonts-server';
import { normalizeResumeData } from '@/lib/normalizeResume';
import { getUserAndTier } from '@/lib/entitlements-server';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

// GET /api/export-pdf?resumeId=... — download a published public resume
// (used by the public portfolio page's "Download PDF" button).
export async function GET(req: NextRequest) {
    const limit = rateLimit(`export-pdf:${getClientIp(req)}`, 20, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit);

    const resumeId = req.nextUrl.searchParams.get('resumeId');
    if (!resumeId) {
        return NextResponse.json({ error: 'Missing resumeId' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Not configured' }, { status: 503 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
            .from('public_templates')
            .select('resume_data')
            .eq('resume_id', resumeId)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        const normalizedData = normalizeResumeData(data.resume_data);

        try {
            registerServerFonts();
        } catch (fontError) {
            console.error('Font registration error:', fontError);
        }

        // Public downloads always carry branding — it's the acquisition loop
        const buffer = await renderToBuffer(<ResumeDocument data={normalizedData} userTier="free" />);

        const fileName = `${(normalizedData.personalInfo?.fullName || 'resume').replace(/\s+/g, '_')}_Resume.pdf`;
        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        console.error('Public PDF export error:', (error as Error).message);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const limit = rateLimit(`export-pdf:${getClientIp(req)}`, 20, 60_000);
    if (!limit.allowed) return rateLimitResponse(limit);

    try {
        const data = await req.json();

        if (!data) {
            return NextResponse.json({
                error: 'Invalid request',
                details: 'No resume data provided'
            }, { status: 400 });
        }

        // Normalize data for React-PDF safety (prevents null.props crashes)
        const normalizedData = normalizeResumeData(data);

        // Tier comes from the server-side profile, never from the request —
        // it controls whether the branding footer can be hidden.
        const { tier } = await getUserAndTier();

        // Register fonts before rendering
        try {
            registerServerFonts();
        } catch (fontError) {
            console.error("Font registration error:", fontError);
            // Continue anyway - we have Helvetica as absolute fallback
        }

        const buffer = await renderToBuffer(<ResumeDocument data={normalizedData} userTier={tier} />);

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline',
            },
        });
    } catch (error) {
        const err = error as Error;
        console.error("PDF Export Error:", err.message, err.stack);

        return NextResponse.json({
            error: 'Failed to generate PDF',
            details: process.env.NODE_ENV === 'development' ? err.message : 'PDF rendering failed. Please try again.',
        }, { status: 500 });
    }
}
