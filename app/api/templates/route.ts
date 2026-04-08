import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET() {
    // Return empty list gracefully if Supabase is not configured
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ templates: [] });
    }

    try {
        const supabase = createClient<Database>(supabaseUrl, supabaseKey);

        // Fetch all public templates (RLS policy allows everyone to read)
        const { data: rawData, error } = await supabase
            .from('public_templates')
            .select('*')
            .order('created_at', { ascending: false });

        const data = rawData as any[] | null;

        if (error) {
            console.warn('Error fetching templates (Supabase may be unavailable):', error);
            return NextResponse.json({ templates: [] });
        }

        // Transform to match expected format
        const templates = (data || []).map(row => ({
            id: row.id,
            resumeId: row.resume_id,
            userId: row.user_id,
            resumeData: row.resume_data,
            resumeName: row.resume_name,
            templateType: row.template_type,
            jobTitle: row.job_title,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));

        return NextResponse.json({ templates });
    } catch (error) {
        console.warn('Error in templates route (Supabase may be unreachable):', error);
        return NextResponse.json({ templates: [] });
    }
}
