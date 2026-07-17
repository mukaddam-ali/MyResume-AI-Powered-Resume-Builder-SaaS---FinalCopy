/**
 * Word (.docx) export — clean single-column document built from ResumeData.
 * Word output is inherently ATS-friendly (real text, standard headings), and
 * many recruiters explicitly ask for .docx files they can edit/annotate.
 */
import {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    AlignmentType, BorderStyle, TabStopType, TabStopPosition,
} from 'docx';
import { ResumeData } from '@/store/useResumeStore';
import { toPlainLines } from '@/lib/ats/metrics';

const ACCENT_FALLBACK = '2563EB';

function hex(color: string | undefined): string {
    const c = (color || '').replace('#', '').trim();
    return /^[0-9a-f]{6}$/i.test(c) ? c.toUpperCase() : ACCENT_FALLBACK;
}

function sectionHeading(text: string, accent: string): Paragraph {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D1D5DB', space: 2 } },
        children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, color: accent })],
    });
}

/** Entry line: bold left title + right-aligned date via a right tab stop. */
function entryHeader(left: string, right: string): Paragraph {
    return new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        spacing: { before: 160, after: 20 },
        children: [
            new TextRun({ text: left, bold: true, size: 22 }),
            new TextRun({ text: `\t${right}`, size: 20, color: '6B7280' }),
        ],
    });
}

function subLine(text: string, accent: string): Paragraph {
    return new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text, italics: true, size: 20, color: accent })],
    });
}

function bullets(description: string | undefined): Paragraph[] {
    return toPlainLines(description).map(line => new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: line, size: 20 })],
    }));
}

export async function generateDocx(data: ResumeData): Promise<Blob> {
    const accent = hex(data.themeColor);
    const info = data.personalInfo;
    const order = data.sectionOrder || [];
    const visible = (id: string) => order.includes(id);
    const title = (id: string, fallback: string) => data.sectionTitles?.[id] || fallback;

    const children: Paragraph[] = [];

    // ── Header ──
    if (info.fullName) {
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [new TextRun({ text: info.fullName, bold: true, size: 44 })],
        }));
    }
    if (info.jobTitle) {
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({ text: info.jobTitle, size: 22, color: accent })],
        }));
    }
    const contactBits = [info.email, info.phone, info.location, info.linkedin, info.github, info.website]
        .filter(v => v && v.trim());
    if (contactBits.length) {
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: hex(data.themeColor), space: 6 } },
            children: [new TextRun({ text: contactBits.join('  |  '), size: 18, color: '4B5563' })],
        }));
    }
    if (info.summary) {
        children.push(sectionHeading(title('personal', 'Professional Summary'), accent));
        children.push(new Paragraph({
            spacing: { after: 80 },
            children: [new TextRun({ text: toPlainLines(info.summary).join(' '), size: 20 })],
        }));
    }

    // ── Body sections in the user's order ──
    for (const id of order) {
        if (id === 'personal') continue;

        const custom = data.customSections?.find(s => s.id === id);
        if (custom && custom.items.length > 0) {
            children.push(sectionHeading(custom.title, accent));
            for (const item of custom.items) {
                children.push(entryHeader(item.name, item.date || ''));
                if (item.city) children.push(subLine(item.city, accent));
                children.push(...bullets(item.description));
            }
            continue;
        }

        switch (id) {
            case 'experience':
                if (!visible('experience') || !data.experience.length) break;
                children.push(sectionHeading(title('experience', 'Professional Experience'), accent));
                for (const exp of data.experience) {
                    children.push(entryHeader(exp.company, `${exp.startDate} - ${exp.endDate}`));
                    if (exp.role) children.push(subLine(exp.role, accent));
                    children.push(...bullets(exp.description));
                }
                break;
            case 'projects':
                if (!data.projects.length) break;
                children.push(sectionHeading(title('projects', 'Projects'), accent));
                for (const proj of data.projects) {
                    children.push(entryHeader(proj.name, proj.link || ''));
                    if (proj.technologies) children.push(subLine(proj.technologies, accent));
                    children.push(...bullets(proj.description));
                }
                break;
            case 'education':
                if (!data.education.length) break;
                children.push(sectionHeading(title('education', 'Education'), accent));
                for (const edu of data.education) {
                    children.push(entryHeader(edu.school, `${edu.startDate} - ${edu.endDate}`));
                    if (edu.degree) children.push(subLine(edu.degree, accent));
                }
                break;
            case 'skills':
                if (!data.skills.length) break;
                children.push(sectionHeading(title('skills', 'Skills'), accent));
                children.push(new Paragraph({
                    spacing: { after: 80 },
                    children: [new TextRun({ text: data.skills.filter(s => s && s.trim()).join('  •  '), size: 20 })],
                }));
                break;
        }
    }

    const doc = new Document({
        styles: {
            default: {
                document: { run: { font: 'Calibri', size: 20 } },
            },
        },
        sections: [{
            properties: {
                page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } },
            },
            children,
        }],
    });

    return Packer.toBlob(doc);
}
