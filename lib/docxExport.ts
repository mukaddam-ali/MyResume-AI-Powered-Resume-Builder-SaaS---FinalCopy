/**
 * Word (.docx) export — clean single-column document built from ResumeData.
 * Word output is inherently ATS-friendly (real text, standard headings), and
 * many recruiters explicitly ask for .docx files they can edit/annotate.
 *
 * Font sizes, spacing and page geometry are kept in sync with the "classic"
 * PDF preview template (components/preview/ResumeDocument.tsx) so a
 * downloaded .docx matches what the user sees on screen, including the
 * "General Scale" / "Section Space" sliders (contentScale / sectionSpacing).
 */
import {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    AlignmentType, BorderStyle, TabStopType, TabStopPosition, LineRuleType,
} from 'docx';
import { ResumeData } from '@/store/useResumeStore';
import { toPlainLines } from '@/lib/ats/metrics';

const ACCENT_FALLBACK = '2563EB';

// A4 page, twips (1pt = 20 twips) — matches the PDF preview's <Page size="A4">
// with paddingVertical: 30 / paddingHorizontal: 40.
const A4_WIDTH_TWIPS = 11906;
const A4_HEIGHT_TWIPS = 16838;
const MARGIN_TOP_BOTTOM_TWIPS = 600; // 30pt
const MARGIN_LEFT_RIGHT_TWIPS = 800; // 40pt

const BODY_LINE_SPACING = { line: 360, lineRule: LineRuleType.AUTO }; // 1.5x, matches preview lineHeight: 1.5

function hex(color: string | undefined): string {
    const c = (color || '').replace('#', '').trim();
    return /^[0-9a-f]{6}$/i.test(c) ? c.toUpperCase() : ACCENT_FALLBACK;
}

export async function generateDocx(data: ResumeData): Promise<Blob> {
    const accent = hex(data.themeColor);
    const info = data.personalInfo;
    const order = data.sectionOrder || [];
    const visible = (id: string) => order.includes(id);
    const title = (id: string, fallback: string) => data.sectionTitles?.[id] || fallback;

    // Same scale factors the live preview applies via createScaledStyles(),
    // so a resume shrunk to fit one page on screen shrinks the same way here.
    const globalScale = typeof data.contentScale === 'number' ? data.contentScale : 1;
    const spacingScale = typeof data.sectionSpacing === 'number' ? data.sectionSpacing : 1;

    /** Scale a font size given in half-points. */
    const fsz = (halfPoints: number) => Math.max(2, Math.round(halfPoints * globalScale));
    /** Scale a spacing value (twips, e.g. paragraph before/after). */
    const sp = (twips: number) => Math.max(0, Math.round(twips * globalScale * spacingScale));

    function sectionHeading(text: string): Paragraph {
        return new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: sp(280), after: sp(120) },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D1D5DB', space: 2 } },
            children: [new TextRun({ text: text.toUpperCase(), bold: true, size: fsz(28), color: accent })],
        });
    }

    /** Entry line: bold left title + right-aligned date via a right tab stop. */
    function entryHeader(left: string, right: string): Paragraph {
        return new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            spacing: { before: sp(160), after: sp(20) },
            children: [
                new TextRun({ text: left, bold: true, size: fsz(22) }),
                new TextRun({ text: `\t${right}`, size: fsz(20), color: '6B7280' }),
            ],
        });
    }

    function subLine(text: string): Paragraph {
        return new Paragraph({
            spacing: { after: sp(60) },
            children: [new TextRun({ text, italics: true, size: fsz(20), color: accent })],
        });
    }

    function bullets(description: string | undefined): Paragraph[] {
        return toPlainLines(description).map(line => new Paragraph({
            bullet: { level: 0 },
            spacing: { after: sp(40), ...BODY_LINE_SPACING },
            children: [new TextRun({ text: line, size: fsz(20) })],
        }));
    }

    const children: Paragraph[] = [];

    // ── Header ──
    if (info.fullName) {
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: sp(40) },
            children: [new TextRun({ text: info.fullName, bold: true, size: fsz(56) })],
        }));
    }
    if (info.jobTitle) {
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: sp(60) },
            children: [new TextRun({ text: info.jobTitle, size: fsz(22), color: accent })],
        }));
    }
    const contactBits = [info.email, info.phone, info.location, info.linkedin, info.github, info.website]
        .filter(v => v && v.trim());
    if (contactBits.length) {
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: sp(160) },
            border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: hex(data.themeColor), space: 6 } },
            children: [new TextRun({ text: contactBits.join('  |  '), size: fsz(18), color: '4B5563' })],
        }));
    }
    if (info.summary) {
        children.push(sectionHeading(title('personal', 'Professional Summary')));
        children.push(new Paragraph({
            spacing: { after: sp(80), ...BODY_LINE_SPACING },
            children: [new TextRun({ text: toPlainLines(info.summary).join(' '), size: fsz(20) })],
        }));
    }

    // ── Body sections in the user's order ──
    for (const id of order) {
        if (id === 'personal') continue;

        const custom = data.customSections?.find(s => s.id === id);
        if (custom && custom.items.length > 0) {
            children.push(sectionHeading(custom.title));
            for (const item of custom.items) {
                children.push(entryHeader(item.name, item.date || ''));
                if (item.city) children.push(subLine(item.city));
                children.push(...bullets(item.description));
            }
            continue;
        }

        switch (id) {
            case 'experience':
                if (!visible('experience') || !data.experience.length) break;
                children.push(sectionHeading(title('experience', 'Professional Experience')));
                for (const exp of data.experience) {
                    children.push(entryHeader(exp.company, `${exp.startDate} - ${exp.endDate}`));
                    if (exp.role) children.push(subLine(exp.role));
                    children.push(...bullets(exp.description));
                }
                break;
            case 'projects':
                if (!data.projects.length) break;
                children.push(sectionHeading(title('projects', 'Projects')));
                for (const proj of data.projects) {
                    children.push(entryHeader(proj.name, proj.link || ''));
                    if (proj.technologies) children.push(subLine(proj.technologies));
                    children.push(...bullets(proj.description));
                }
                break;
            case 'education':
                if (!data.education.length) break;
                children.push(sectionHeading(title('education', 'Education')));
                for (const edu of data.education) {
                    children.push(entryHeader(edu.school, `${edu.startDate} - ${edu.endDate}`));
                    if (edu.degree) children.push(subLine(edu.degree));
                }
                break;
            case 'skills':
                if (!data.skills.length) break;
                children.push(sectionHeading(title('skills', 'Skills')));
                children.push(new Paragraph({
                    spacing: { after: sp(80), ...BODY_LINE_SPACING },
                    children: [new TextRun({ text: data.skills.filter(s => s && s.trim()).join('  •  '), size: fsz(20) })],
                }));
                break;
        }
    }

    const doc = new Document({
        styles: {
            default: {
                document: { run: { font: 'Calibri', size: fsz(20) } },
            },
        },
        sections: [{
            properties: {
                page: {
                    size: { width: A4_WIDTH_TWIPS, height: A4_HEIGHT_TWIPS },
                    margin: {
                        top: MARGIN_TOP_BOTTOM_TWIPS,
                        bottom: MARGIN_TOP_BOTTOM_TWIPS,
                        left: MARGIN_LEFT_RIGHT_TWIPS,
                        right: MARGIN_LEFT_RIGHT_TWIPS,
                    },
                },
            },
            children,
        }],
    });

    return Packer.toBlob(doc);
}
