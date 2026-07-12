/**
 * Deterministic resume-quality metrics.
 * Pure functions over ResumeData — the same resume ALWAYS produces the same
 * scores (unlike LLM scoring). These feed the Impact / Brevity / Style /
 * Structure subscores of the ATS scan.
 */
import { ResumeData } from '@/store/useResumeStore';

// Strong action verbs recruiters/ATS heuristics look for at bullet starts
const ACTION_VERBS = new Set([
    'achieved', 'accelerated', 'architected', 'automated', 'built', 'created', 'cut',
    'decreased', 'delivered', 'designed', 'developed', 'directed', 'doubled', 'drove',
    'engineered', 'established', 'exceeded', 'expanded', 'generated', 'grew', 'implemented',
    'improved', 'increased', 'initiated', 'launched', 'led', 'managed', 'mentored',
    'migrated', 'optimized', 'orchestrated', 'overhauled', 'owned', 'pioneered', 'produced',
    'reduced', 'refactored', 'redesigned', 'resolved', 'scaled', 'shipped', 'spearheaded',
    'streamlined', 'strengthened', 'transformed', 'tripled', 'won',
]);

const WEAK_OPENERS = new Set([
    'responsible', 'worked', 'helped', 'assisted', 'participated', 'involved', 'duties', 'tasked',
]);

const FIRST_PERSON = /\b(i|me|my|mine|myself|we|our)\b/i;

/** Strip Tiptap HTML / markdown noise down to plain text lines. */
export function toPlainLines(description: string | undefined): string[] {
    if (!description) return [];
    const text = description
        .replace(/<li[^>]*>/gi, '\n• ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&');
    return text
        .split('\n')
        .map(l => l.replace(/^[•\-•*]\s*/, '').trim())
        .filter(l => l.length > 2);
}

export interface WritingMetrics {
    bulletCount: number;
    quantifiedPct: number;      // % of bullets containing a number/metric
    actionVerbPct: number;      // % of bullets starting with a strong verb
    weakOpenerCount: number;
    firstPersonCount: number;
    avgBulletWords: number;
    longBulletCount: number;    // bullets over 32 words
    totalWords: number;
    dateFormats: string[];      // distinct date styles found
    dateConsistent: boolean;
}

const NUMBERISH = /(\d+[%+kKmM]?|\$\d|\d+x\b|percent)/;

function classifyDate(d: string): string | null {
    const s = (d || '').trim();
    if (!s) return null;
    if (/^(present|current|now)$/i.test(s)) return null; // "Present" is fine with anything
    if (/^\d{4}$/.test(s)) return 'YYYY';
    if (/^\d{1,2}\/\d{4}$/.test(s)) return 'MM/YYYY';
    if (/^[a-z]{3,9}\.?\s+\d{4}$/i.test(s)) return 'Month YYYY';
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) return 'DD/MM/YYYY';
    return 'other';
}

export function computeWritingMetrics(data: ResumeData): WritingMetrics {
    const bullets: string[] = [];
    for (const exp of data.experience || []) bullets.push(...toPlainLines(exp.description));
    for (const proj of data.projects || []) bullets.push(...toPlainLines(proj.description));
    for (const cs of data.customSections || [])
        for (const item of cs.items || []) bullets.push(...toPlainLines(item.description));

    const summaryLines = toPlainLines(data.personalInfo?.summary);
    const allText = [...bullets, ...summaryLines].join(' ');
    const totalWords = allText.split(/\s+/).filter(Boolean).length;

    let quantified = 0, actionVerb = 0, weakOpeners = 0, firstPerson = 0, longBullets = 0, wordSum = 0;
    for (const b of bullets) {
        const words = b.split(/\s+/).filter(Boolean);
        wordSum += words.length;
        if (words.length > 32) longBullets++;
        if (NUMBERISH.test(b)) quantified++;
        const first = (words[0] || '').toLowerCase().replace(/[^a-z]/g, '');
        if (ACTION_VERBS.has(first) || ACTION_VERBS.has(first.replace(/ing$/, ''))) actionVerb++;
        if (WEAK_OPENERS.has(first)) weakOpeners++;
        if (FIRST_PERSON.test(b)) firstPerson++;
    }

    const formats = new Set<string>();
    for (const e of [...(data.experience || []), ...(data.education || [])]) {
        for (const d of [e.startDate, e.endDate]) {
            const f = classifyDate(d);
            if (f) formats.add(f);
        }
    }

    return {
        bulletCount: bullets.length,
        quantifiedPct: bullets.length ? Math.round((quantified / bullets.length) * 100) : 0,
        actionVerbPct: bullets.length ? Math.round((actionVerb / bullets.length) * 100) : 0,
        weakOpenerCount: weakOpeners,
        firstPersonCount: firstPerson,
        avgBulletWords: bullets.length ? Math.round(wordSum / bullets.length) : 0,
        longBulletCount: longBullets,
        totalWords,
        dateFormats: [...formats],
        dateConsistent: formats.size <= 1,
    };
}

export interface StructureMetrics {
    hasName: boolean;
    hasEmail: boolean;
    hasPhone: boolean;
    hasSummary: boolean;
    hasExperience: boolean;
    hasEducation: boolean;
    skillCount: number;
    visibleSections: string[];
}

export function computeStructureMetrics(data: ResumeData): StructureMetrics {
    const order = data.sectionOrder || [];
    const visible = (id: string) => order.includes(id);
    return {
        hasName: !!data.personalInfo?.fullName?.trim() && data.personalInfo.fullName.trim() !== 'New User',
        hasEmail: !!data.personalInfo?.email?.trim(),
        hasPhone: !!data.personalInfo?.phone?.trim(),
        hasSummary: !!data.personalInfo?.summary?.trim(),
        hasExperience: visible('experience') && (data.experience?.length || 0) > 0,
        hasEducation: visible('education') && (data.education?.length || 0) > 0,
        skillCount: visible('skills') ? (data.skills?.length || 0) : 0,
        visibleSections: order,
    };
}

/** 0–100 subscores with fixed weights — fully reproducible. */
export function scoreCategories(w: WritingMetrics, s: StructureMetrics) {
    // Impact: quantified achievements + strong verbs
    const impact = Math.round(
        Math.min(100, w.quantifiedPct * 0.7 + w.actionVerbPct * 0.3)
    );

    // Brevity: right-sized bullets and total length
    let brevity = 100;
    if (w.avgBulletWords > 28) brevity -= 25;
    else if (w.avgBulletWords > 22) brevity -= 10;
    if (w.avgBulletWords > 0 && w.avgBulletWords < 6) brevity -= 20; // too thin
    brevity -= Math.min(30, w.longBulletCount * 8);
    if (w.totalWords > 900) brevity -= 15;
    if (w.totalWords < 120) brevity -= 25;
    brevity = Math.max(0, Math.min(100, brevity));

    // Style: professional writing conventions
    let style = 100;
    style -= Math.min(30, w.firstPersonCount * 6);
    style -= Math.min(30, w.weakOpenerCount * 6);
    if (!w.dateConsistent) style -= 15;
    style = Math.max(0, Math.min(100, style));

    // Structure: essential sections present
    let structure = 0;
    if (s.hasName) structure += 15;
    if (s.hasEmail) structure += 15;
    if (s.hasPhone) structure += 5;
    if (s.hasSummary) structure += 15;
    if (s.hasExperience) structure += 25;
    if (s.hasEducation) structure += 10;
    if (s.skillCount >= 5) structure += 15;
    else if (s.skillCount > 0) structure += 8;
    structure = Math.min(100, structure);

    return { impact, brevity, style, structure };
}
