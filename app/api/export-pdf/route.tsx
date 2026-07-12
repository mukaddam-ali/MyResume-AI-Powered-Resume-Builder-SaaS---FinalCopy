import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ResumeDocument } from '@/components/preview/ResumeDocument';
import { registerServerFonts } from '@/lib/fonts-server';
import { normalizeResumeData } from '@/lib/normalizeResume';
import { getUserAndTier } from '@/lib/entitlements-server';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

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
