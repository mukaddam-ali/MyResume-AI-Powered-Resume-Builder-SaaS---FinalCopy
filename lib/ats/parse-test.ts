/**
 * Real ATS parse test (server-only).
 *
 * Renders the user's ACTUAL resume PDF with the same renderer as the download
 * button, then extracts text with pdf-parse — the same class of extraction a
 * real ATS (Workday/Greenhouse/Lever) performs on upload — and scores what
 * survives. This tests the PDF, not the form data.
 */
import 'server-only';
import React from 'react';
import { createRequire } from 'module';
import { renderToBuffer } from '@react-pdf/renderer';
import { ResumeDocument } from '@/components/preview/ResumeDocument';
import { registerServerFonts } from '@/lib/fonts-server';
import { ResumeData } from '@/store/useResumeStore';
import { toPlainLines } from './metrics';

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const LINKEDIN_RE = /linkedin\.com\/in\/|linkedin/i;

const TWO_COLUMN_TEMPLATES = new Set(['modern', 'creative']);

const DEFAULT_HEADINGS: Record<string, string[]> = {
    experience: ['professional experience', 'experience', 'work experience'],
    education: ['education'],
    projects: ['projects'],
    skills: ['skills'],
};

export interface ParseTestResult {
    ok: boolean;
    extractionRate: number;      // % of source content words recovered from the PDF
    emailFound: boolean;
    phoneFound: boolean;
    linkedinFound: boolean;
    headingsFound: string[];
    headingsMissing: string[];
    headingOrder: string[];      // headings in the order the parser encounters them
    twoColumnLayout: boolean;
    pageCount: number;
    extractedText: string;       // what the ATS "sees" (trimmed)
    error?: string;
}

/** Unique source-content words (4+ chars) we expect to survive extraction. */
function sourceWords(data: ResumeData): Set<string> {
    const parts: string[] = [
        data.personalInfo?.fullName || '',
        data.personalInfo?.jobTitle || '',
        ...toPlainLines(data.personalInfo?.summary),
        ...(data.skills || []),
    ];
    for (const exp of data.experience || []) {
        parts.push(exp.company, exp.role, ...toPlainLines(exp.description));
    }
    for (const proj of data.projects || []) {
        parts.push(proj.name, ...toPlainLines(proj.description));
    }
    for (const edu of data.education || []) {
        parts.push(edu.school, edu.degree);
    }
    const words = new Set<string>();
    for (const p of parts) {
        for (const w of (p || '').toLowerCase().split(/[^a-z0-9+#]+/)) {
            if (w.length >= 4) words.add(w);
        }
    }
    return words;
}

export async function runParseTest(data: ResumeData): Promise<ParseTestResult> {
    const empty: ParseTestResult = {
        ok: false, extractionRate: 0, emailFound: false, phoneFound: false,
        linkedinFound: false, headingsFound: [], headingsMissing: [],
        headingOrder: [], twoColumnLayout: TWO_COLUMN_TEMPLATES.has(data.selectedTemplate),
        pageCount: 0, extractedText: '',
    };

    // 1. Render the real PDF (branding state doesn't affect parsing)
    let pdfBuffer: Buffer;
    try {
        try { registerServerFonts(); } catch { /* Helvetica fallback */ }
        pdfBuffer = await renderToBuffer(
            React.createElement(ResumeDocument, { data, userTier: 'pro' }) as any
        );
    } catch (e) {
        return { ...empty, error: 'PDF rendering failed: ' + (e as Error).message };
    }

    // 2. Extract text exactly like an ATS parser would
    let text = '';
    let pageCount = 0;
    try {
        const requireNode = createRequire(import.meta.url);
        const pdfParse = requireNode('pdf-parse/lib/pdf-parse.js') as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
        const result = await pdfParse(pdfBuffer);
        text = result.text || '';
        pageCount = result.numpages || 1;
    } catch (e) {
        return { ...empty, error: 'Text extraction failed — this PDF may be unreadable by ATS parsers.' };
    }

    const lowerText = text.toLowerCase();

    // 3. Content survival rate
    const expected = sourceWords(data);
    let foundWords = 0;
    for (const w of expected) {
        if (lowerText.includes(w)) foundWords++;
    }
    const extractionRate = expected.size ? Math.round((foundWords / expected.size) * 100) : 0;

    // 4. Contact info detectable in the PARSED text (what an ATS auto-fills)
    const emailFound = !!data.personalInfo?.email?.trim() && EMAIL_RE.test(text);
    const phoneFound = !!data.personalInfo?.phone?.trim() && PHONE_RE.test(text);
    const linkedinFound = !!data.personalInfo?.linkedin?.trim() && LINKEDIN_RE.test(text);

    // 5. Section headings the parser can find, in encounter order
    const sectionIds = (data.sectionOrder || []).filter(id => id !== 'personal');
    const positions: { id: string; pos: number }[] = [];
    const headingsFound: string[] = [];
    const headingsMissing: string[] = [];

    for (const id of sectionIds) {
        const custom = data.customSections?.find(s => s.id === id);
        const candidates = custom
            ? [custom.title.toLowerCase()]
            : [
                ...(data.sectionTitles?.[id] ? [data.sectionTitles[id].toLowerCase()] : []),
                ...(DEFAULT_HEADINGS[id] || []),
            ];
        let pos = -1;
        for (const c of candidates) {
            if (!c) continue;
            const p = lowerText.indexOf(c);
            if (p !== -1 && (pos === -1 || p < pos)) pos = p;
        }
        const label = custom?.title || data.sectionTitles?.[id] ||
            id.charAt(0).toUpperCase() + id.slice(1);
        if (pos !== -1) {
            headingsFound.push(label);
            positions.push({ id: label, pos });
        } else {
            headingsMissing.push(label);
        }
    }
    positions.sort((a, b) => a.pos - b.pos);

    return {
        ok: true,
        extractionRate,
        emailFound,
        phoneFound,
        linkedinFound,
        headingsFound,
        headingsMissing,
        headingOrder: positions.map(p => p.id),
        twoColumnLayout: TWO_COLUMN_TEMPLATES.has(data.selectedTemplate),
        pageCount,
        extractedText: text.trim().slice(0, 6000),
    };
}

/** 0–100 parse subscore with fixed weights. */
export function scoreParse(p: ParseTestResult, hasEmail: boolean, hasPhone: boolean): number {
    if (!p.ok) return 0;
    let score = 0;
    // Content survival is the core of ATS-compatibility
    score += Math.round(p.extractionRate * 0.6);
    if (!hasEmail || p.emailFound) score += 15; else score += 0;
    if (!hasPhone || p.phoneFound) score += 8;
    const totalHeadings = p.headingsFound.length + p.headingsMissing.length;
    if (totalHeadings > 0) {
        score += Math.round((p.headingsFound.length / totalHeadings) * 17);
    } else {
        score += 8;
    }
    return Math.max(0, Math.min(100, score));
}
