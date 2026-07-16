import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 50;

/**
 * Strip anything personal from gallery listings. Published rows are already
 * sanitized at publish time, but old rows may predate that fix — never trust
 * stored data to be clean.
 */
function sanitizeGalleryData(resumeData: any) {
    if (!resumeData || typeof resumeData !== 'object') return resumeData;
    return {
        ...resumeData,
        analysisResult: null,
        variants: undefined,
        // Project images are for the portfolio page — too heavy for gallery listings
        projects: Array.isArray(resumeData.projects)
            ? resumeData.projects.map((p: any) => ({ ...p, image: undefined }))
            : resumeData.projects,
        personalInfo: {
            ...(resumeData.personalInfo || {}),
            email: '',
            phone: '',
            linkedin: '',
            website: '',
            github: '',
            location: resumeData.personalInfo?.location || '',
            photo: undefined,
            photoFilters: undefined,
            socialMedia: undefined,
        },
    };
}

export async function GET(request: NextRequest) {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ templates: [] });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10) || 0);
    const pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
    );

    try {
        const supabase = createClient<Database>(supabaseUrl, supabaseKey);

        const from = page * pageSize;
        const { data: rawData, error, count } = await supabase
            .from('public_templates')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, from + pageSize - 1);

        const data = rawData as any[] | null;

        if (error) {
            console.warn('Error fetching templates:', error.message);
            return NextResponse.json({ templates: [] });
        }

        const templates = (data || []).map(row => ({
            id: row.id,
            resumeId: row.resume_id,
            resumeData: sanitizeGalleryData(row.resume_data),
            resumeName: row.resume_name,
            templateType: row.template_type,
            jobTitle: row.job_title,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));

        return NextResponse.json({ templates, total: count ?? templates.length, page, pageSize });
    } catch (error) {
        console.warn('Error in templates route:', error);
        return NextResponse.json({ templates: [] });
    }
}
