/**
 * Normalize resume data for React-PDF rendering
 * React-PDF is strict about data types and cannot handle:
 * - null/undefined children
 * - Mixed types (string | array)
 * - Conditional expressions
 */

/**
 * Normalize skills field to always be a string array
 * Handles: string (comma-separated), string[], null, undefined
 */
export function normalizeSkills(
    skills: string | string[] | null | undefined
): string[] {
    if (!skills) return [];

    if (Array.isArray(skills)) {
        return skills.filter(Boolean);
    }

    return skills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}

/**
 * Normalize all resume data for safe React-PDF rendering
 */
export function normalizeResumeData(data: any): any {
    return {
        ...data,
        // Ensure all arrays exist and are proper arrays
        // Ensure objects exist and fields are strings
        personalInfo: {
            fullName: data?.personalInfo?.fullName || '',
            jobTitle: data?.personalInfo?.jobTitle || '', // Restored
            email: data?.personalInfo?.email || '',
            phone: data?.personalInfo?.phone || '',
            location: data?.personalInfo?.location || '',
            website: data?.personalInfo?.website || '',
            linkedin: data?.personalInfo?.linkedin || '',
            github: data?.personalInfo?.github || '',
            summary: data?.personalInfo?.summary || '',
            photo: data?.personalInfo?.photo || '', // Restored (string)
            photoFilters: data?.personalInfo?.photoFilters || { // Restored (object with defaults)
                scale: 1,
                brightness: 1,
                contrast: 1,
                grayscale: 0,
                borderWidth: 0,
                borderColor: '#ffffff',
                borderRadius: 0
            },
            socialMedia: Array.isArray(data?.personalInfo?.socialMedia) ? data.personalInfo.socialMedia.map((s: any) => ({
                id: s?.id || crypto.randomUUID(),
                platform: s?.platform || 'website',
                url: s?.url || '',
                username: s?.username || '',
                enabled: s?.enabled !== false
            })) : []
        },
        sectionScales: data?.sectionScales || {},
        sectionTitles: data?.sectionTitles || {},

        // Deep normalization for arrays to prevent nulls inside objects
        education: Array.isArray(data?.education) ? data.education.map((edu: any) => ({
            id: edu?.id || crypto.randomUUID(), // Ensure ID
            school: edu?.school || '',
            degree: edu?.degree || '',
            startDate: edu?.startDate || '',
            endDate: edu?.endDate || '',
            city: edu?.city || ''
        })) : [],

        experience: Array.isArray(data?.experience) ? data.experience.map((exp: any) => ({
            id: exp?.id || crypto.randomUUID(), // Ensure ID
            company: exp?.company || '',
            role: exp?.role || '',
            date: exp?.date || '',
            startDate: exp?.startDate || '',
            endDate: exp?.endDate || '',
            city: exp?.city || '',
            description: exp?.description || ''
        })) : [],

        projects: Array.isArray(data?.projects) ? data.projects.map((proj: any) => ({
            id: proj?.id || crypto.randomUUID(), // Ensure ID
            name: proj?.name || '',
            description: proj?.description || '',
            link: proj?.link || '',
            linkText: proj?.linkText || '',
            technologies: proj?.technologies || ''
        })) : [],

        customSections: Array.isArray(data?.customSections) ? data.customSections.map((sec: any) => ({
            id: sec?.id || '',
            title: sec?.title || '',
            items: Array.isArray(sec?.items) ? sec.items.map((item: any) => ({
                id: item?.id || '',
                name: item?.name || '',
                description: item?.description || '',
                date: item?.date || '',
                city: item?.city || ''
            })) : []
        })) : [],

        skills: normalizeSkills(data?.skills),
        sectionOrder: Array.isArray(data?.sectionOrder)
            ? Array.from(new Set(data.sectionOrder)) as string[] // Deduplicate
            : ['personal', 'education', 'experience', 'projects', 'skills'],

        // Ensure primitives have defaults
        selectedTemplate: data?.selectedTemplate || 'classic',
        themeColor: data?.themeColor || '#112e51',
        contentScale: typeof data?.contentScale === 'number' ? data.contentScale : 1,

        fontFamily: data?.fontFamily || 'roboto',
    };
}
