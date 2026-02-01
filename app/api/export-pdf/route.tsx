import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ResumeDocument } from '@/components/preview/ResumeDocument';
import { registerServerFonts } from '@/lib/fonts-server';
import { normalizeResumeData } from '@/lib/normalizeResume';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();

        // Validate data exists
        if (!data) {
            return NextResponse.json({
                error: 'Invalid request',
                details: 'No resume data provided'
            }, { status: 400 });
        }

        // Normalize data for React-PDF safety (prevents null.props crashes)
        const normalizedData = normalizeResumeData(data);

        // Dev-only validation
        if (process.env.NODE_ENV === 'development') {
            if (!Array.isArray(normalizedData.skills)) {
                throw new Error('Skills must be an array after normalization');
            }
        }

        // Register fonts before rendering
        try {
            registerServerFonts();
        } catch (fontError) {
            console.error("Font registration error:", fontError);
            // Continue anyway - we have Helvetica as absolute fallback
        }

        console.log("PDF Export Request:");
        console.log(" - Template:", normalizedData.selectedTemplate);
        console.log(" - Font:", normalizedData.fontFamily);
        console.log(" - Info:", normalizedData.personalInfo?.fullName);
        console.log(" - Has Education:", Array.isArray(normalizedData.education), `(${normalizedData.education.length} items)`);
        console.log(" - Has Experience:", Array.isArray(normalizedData.experience), `(${normalizedData.experience.length} items)`);
        console.log(" - Has Projects:", Array.isArray(normalizedData.projects), `(${normalizedData.projects.length} items)`);
        console.log(" - Skills:", Array.isArray(normalizedData.skills), `(${normalizedData.skills.length} items)`);

        // Generate PDF on server with normalized data
        const buffer = await renderToBuffer(<ResumeDocument data={normalizedData} userTier="pro" />);

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline',
            },
        });
    } catch (error) {
        const err = error as Error;
        console.error("PDF Export Error:", err.message);
        console.error("Error name:", err.name);
        console.error("Error stack:", err.stack);

        // Extract font information from the error if available
        const errorMessage = err.message || 'Unknown error occurred during PDF generation';
        const isFontError = errorMessage.toLowerCase().includes('font') ||
            errorMessage.toLowerCase().includes('cannot read properties of null');

        return NextResponse.json({
            error: 'Failed to generate PDF',
            details: errorMessage,
            name: err.name || 'Error',
            isFontError,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
            debug: {
                cwd: process.cwd(),
                fontsDirExists: require('fs').existsSync(require('path').join(process.cwd(), 'public', 'fonts')),
                filesInFonts: require('fs').existsSync(require('path').join(process.cwd(), 'public', 'fonts')) ? require('fs').readdirSync(require('path').join(process.cwd(), 'public', 'fonts')).slice(0, 5) : []
            }
        }, { status: 500 });
    }
}
