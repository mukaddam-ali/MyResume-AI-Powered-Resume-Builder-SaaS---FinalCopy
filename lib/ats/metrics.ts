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
    dateFormats: string[];      // distinct date styles found (informational)
    dateConsistent: boolean;    // consistent WITHIN each section (edu vs work may differ)
    noYearDates: string[];      // dates missing a year — unparseable by ATS
}

const NUMBERISH = /(\d+[%+kKmM]?|\$\d|\d+x\b|percent)/;

/**
 * Classify a date string's format. Returns null for values that are
 * conventional alongside any format ("Present", "Expected 2027") and
 * 'no-year' for dates an ATS cannot anchor in time ("15 May").
 */
function classifyDate(d: string): string | null {
    const s = (d || '').trim().replace(/[()]/g, '');
    if (!s) return null;
    if (/^(present|current|now|ongoing)$/i.test(s)) return null;
    // "Expected 2027" / "Anticipated May 2027" — standard for in-progress degrees
    if (/^(expected|anticipated|exp\.?|graduating)\b/i.test(s)) return null;
    if (/^\d{4}$/.test(s)) return 'YYYY';
    if (/^\d{1,2}\/\d{4}$/.test(s)) return 'MM/YYYY';
    if (/^[a-z]{3,9}\.?\s+\d{4}$/i.test(s)) return 'Month YYYY';
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) return 'DD/MM/YYYY';
    // Day + month (or month + day) with NO year — unparseable by ATS
    if (/^\d{1,2}\s+[a-z]{3,9}\.?$/i.test(s) || /^[a-z]{3,9}\.?\s+\d{1,2}$/i.test(s)) return 'no-year';
    if (/^[a-z]{3,9}\.?$/i.test(s)) return 'no-year'; // bare month name
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

    // Date consistency is judged PER SECTION: education using years-only while
    // experience uses "Month YYYY" is a normal, accepted convention.
    const noYearDates: string[] = [];
    const allFormats = new Set<string>();
    const sectionConsistent = (entries: { startDate: string; endDate: string }[]) => {
        const formats = new Set<string>();
        for (const e of entries) {
            for (const d of [e.startDate, e.endDate]) {
                const f = classifyDate(d);
                if (!f) continue;
                if (f === 'no-year') { noYearDates.push(d.trim()); continue; }
                formats.add(f);
                allFormats.add(f);
            }
        }
        return formats.size <= 1;
    };
    const expConsistent = sectionConsistent(data.experience || []);
    const eduConsistent = sectionConsistent(data.education || []);

    return {
        bulletCount: bullets.length,
        quantifiedPct: bullets.length ? Math.round((quantified / bullets.length) * 100) : 0,
        actionVerbPct: bullets.length ? Math.round((actionVerb / bullets.length) * 100) : 0,
        weakOpenerCount: weakOpeners,
        firstPersonCount: firstPerson,
        avgBulletWords: bullets.length ? Math.round(wordSum / bullets.length) : 0,
        longBulletCount: longBullets,
        totalWords,
        dateFormats: [...allFormats],
        dateConsistent: expConsistent && eduConsistent,
        noYearDates,
    };
}

export interface BulletSegment {
    text: string;   // plain text, for issue detection
    raw: string;    // verbatim HTML fragment (the <li>...</li> or <p>...</p>), for splicing a rewrite back in
}

/**
 * Split a Tiptap HTML description into ordered, atomic bullet segments,
 * keeping the raw HTML fragment alongside the plain text so a rewrite can
 * be spliced back into the description verbatim (string replace on `raw`).
 * Each <li> (or, if there's no list, each <p>) is treated as one atomic
 * unit — manual <br>-separated pseudo-bullets within a single block are not
 * split further here (computeWritingMetrics/toPlainLines still handles that
 * for aggregate scoring; this function is only used for locating + applying
 * specific rewrites, so that tradeoff doesn't affect the score).
 */
export function getBulletSegments(description: string | undefined): BulletSegment[] {
    if (!description) return [];
    const liMatches = description.match(/<li\b[^>]*>[\s\S]*?<\/li>/gi);
    const blocks = liMatches && liMatches.length > 0
        ? liMatches
        : (description.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) || []);

    return blocks
        .map(raw => {
            const text = raw
                .replace(/<[^>]+>/g, '')
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/^[•\-*]\s*/, '')
                .replace(/\s+/g, ' ')
                .trim();
            return { text, raw };
        })
        .filter(seg => seg.text.length > 2);
}

function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Rebuild a bullet's raw HTML fragment with new text, preserving its outer
 * <li>/<p> wrapper (and inner <p> if the list item had one) so the rewrite
 * drops in cleanly. Any inline formatting inside the original bullet is not
 * preserved — the rewrite replaces the bullet's content wholesale.
 */
export function wrapBulletReplacement(raw: string, newText: string): string {
    const escaped = escapeHtml(newText);
    const liMatch = raw.match(/^(<li[^>]*>)([\s\S]*)(<\/li>)$/i);
    if (liMatch) {
        const inner = liMatch[2].trim();
        const pMatch = inner.match(/^(<p[^>]*>)[\s\S]*(<\/p>)$/i);
        return pMatch
            ? `${liMatch[1]}${pMatch[1]}${escaped}${pMatch[2]}${liMatch[3]}`
            : `${liMatch[1]}${escaped}${liMatch[3]}`;
    }
    const pMatch = raw.match(/^(<p[^>]*>)([\s\S]*)(<\/p>)$/i);
    if (pMatch) {
        return `${pMatch[1]}${escaped}${pMatch[3]}`;
    }
    return escaped;
}

export interface WeakBullet {
    section: string;       // 'Experience' | 'Projects' | custom section title
    entryLabel: string;    // e.g. "Software Engineer — Acme Corp"
    entryType: 'experience' | 'project' | 'custom';
    entryId: string;
    customSectionId?: string; // set only when entryType === 'custom'
    index: number;          // 1-based bullet position within that entry
    text: string;           // the actual bullet text, verbatim
    raw: string;            // verbatim HTML fragment — used to splice a rewrite back in
    issues: string[];       // human-readable reasons this bullet was flagged
}

/**
 * Locate the specific bullets dragging the score down — not just an
 * aggregate percentage, but which entry and which line, so a user can go
 * straight to the spot that needs editing (or apply a rewrite there).
 */
export function findWeakBullets(data: ResumeData): WeakBullet[] {
    const results: WeakBullet[] = [];

    const analyze = (
        section: string,
        entryLabel: string,
        entryType: WeakBullet['entryType'],
        entryId: string,
        customSectionId: string | undefined,
        description: string | undefined
    ) => {
        getBulletSegments(description).forEach((seg, i) => {
            const words = seg.text.split(/\s+/).filter(Boolean);
            const first = (words[0] || '').toLowerCase().replace(/[^a-z]/g, '');
            const issues: string[] = [];

            if (WEAK_OPENERS.has(first)) {
                issues.push(`Starts with a weak phrase ("${words[0]}") — lead with an action verb instead.`);
            } else if (!ACTION_VERBS.has(first) && !ACTION_VERBS.has(first.replace(/ing$/, ''))) {
                issues.push('Doesn\'t open with a strong action verb.');
            }
            if (!NUMBERISH.test(seg.text)) {
                issues.push('No measurable result — add a number (%, $, count, or time saved).');
            }
            if (FIRST_PERSON.test(seg.text)) {
                issues.push('Uses first-person ("I"/"my") — resumes omit pronouns.');
            }
            if (words.length > 32) {
                issues.push(`Too long (${words.length} words) — tighten to under ~25.`);
            }

            if (issues.length > 0) {
                results.push({ section, entryLabel, entryType, entryId, customSectionId, index: i + 1, text: seg.text, raw: seg.raw, issues });
            }
        });
    };

    for (const exp of data.experience || []) {
        analyze('Experience', [exp.role, exp.company].filter(Boolean).join(' — ') || 'Experience entry', 'experience', exp.id, undefined, exp.description);
    }
    for (const proj of data.projects || []) {
        analyze('Projects', proj.name || 'Project', 'project', proj.id, undefined, proj.description);
    }
    for (const cs of data.customSections || []) {
        for (const item of cs.items || []) {
            analyze(cs.title || 'Custom section', item.name || 'Item', 'custom', item.id, cs.id, item.description);
        }
    }

    // Worst offenders first; cap so the list stays actionable rather than overwhelming.
    return results.sort((a, b) => b.issues.length - a.issues.length).slice(0, 15);
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
    if (!w.dateConsistent) style -= 8;                       // soft: mixed styles within a section
    style -= Math.min(15, w.noYearDates.length * 5);         // hard: dates an ATS can't parse at all
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
