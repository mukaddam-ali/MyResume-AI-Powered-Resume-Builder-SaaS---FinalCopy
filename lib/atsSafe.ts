import { ResumeData } from '@/store/useResumeStore';

/**
 * Transform any resume into its most ATS-parseable form:
 * - Classic template: single column, top-to-bottom reading order
 * - Standard section headings (Experience/Education/Projects/Skills) so ATS
 *   field-mapping matches; custom sections keep their user-given titles
 * - No photo (parsers can choke on images; photos also invite bias screening)
 * - Neutral scaling — no shrunken text
 *
 * The same renderer produces it, so what you download is exactly what the
 * ATS scan verifies.
 */
export function toAtsSafeResume(data: ResumeData): ResumeData {
    return {
        ...data,
        selectedTemplate: 'classic',
        fontFamily: 'roboto',
        contentScale: 1,
        sectionScales: {},
        sectionSpacing: 1,
        // Standard headings for the standard sections; custom sections are
        // defined in customSections and keep their own titles.
        sectionTitles: {},
        personalInfo: {
            ...data.personalInfo,
            photo: undefined,
            photoFilters: undefined,
        },
    };
}
