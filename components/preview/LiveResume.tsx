"use client";

import React from 'react';
import { ResumeData, useResumeStore } from '@/store/useResumeStore';
import { cn } from '@/lib/utils';
import { Mail, Phone, MapPin, Linkedin, Link as LinkIcon, Github, Sparkles } from 'lucide-react';
import { FormattedText } from '@/components/preview/FormattedText';
import { RESUME_STYLES } from '@/lib/styles/resume-constants';
import { useAuth } from '@/lib/auth-context';

interface LiveResumeProps {
    data: ResumeData;
    scale?: number;
}

// Define which fonts are premium
const PREMIUM_FONTS = ['nunito', 'merriweather', 'librebaskerville'];

export default function LiveResume({ data, scale = 1 }: LiveResumeProps) {
    const { isPremium } = useAuth();
    // Watermark is shown for non-premium users.
    // Reads from the actual auth state (not the debug toggle) so it tracks the real subscription.
    const showBranding = !isPremium;
    const { personalInfo, education, experience, projects, skills, selectedTemplate, themeColor: customThemeColor, contentScale = 1, isBrandingEnabled = true, fontFamily: fontId = 'roboto', sectionScales, sectionTitles = {} } = data;

    // Map font IDs to CSS font family values
    const FONT_FAMILY_MAP: Record<string, string> = {
        // Sans-Serif (Free)
        'roboto': 'Roboto, sans-serif',
        'opensans': '"Open Sans", sans-serif',
        'lato': 'Lato, sans-serif',
        'sourcesans': '"Source Sans 3", sans-serif',

        // Premium
        'nunito': 'Nunito, sans-serif',
        'merriweather': 'Merriweather, serif',
        'librebaskerville': '"Libre Baskerville", serif',
    };

    // Enforce free tier: fall back to 'roboto' if user is free and has a premium font
    const effectiveFontId = (!isPremium && PREMIUM_FONTS.includes(fontId)) ? 'roboto' : fontId;
    const fontFamily = FONT_FAMILY_MAP[effectiveFontId] || 'Roboto, sans-serif';


    // Default to a dark navy if no color set
    const themeColor = customThemeColor || '#112e51';


    // --- SECTION RENDERERS (Internal Helpers) ---
    const renderSectionContent = (sectionId: string) => {
        switch (sectionId) {
            case 'education':
                if (education.length === 0) return null;
                if (selectedTemplate === 'modern') {
                    if (education.length === 0) return null;
                    return (
                        <div key="education" className="mb-6">
                            <h3 className="uppercase tracking-widest text-xs font-bold border-b pb-2 mb-4 opacity-80 text-white border-white/30">
                                {sectionTitles.education || "Education"}
                            </h3>
                            <div className="space-y-4">
                                {education.map(edu => (
                                    <div key={edu.id}>
                                        <div className="font-bold">{edu.school}</div>
                                        <div className="text-xs opacity-80">{edu.degree}</div>
                                        <div className="text-[10px] opacity-60 mt-1">{edu.startDate} – {edu.endDate}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                if (selectedTemplate === 'creative') {
                    if (education.length === 0) return null;
                    return (
                        <div key="education" className="mb-6 text-white">
                            <h3 className="uppercase tracking-widest text-xs font-bold border-b pb-2 mb-4 opacity-80 border-white/20">
                                {sectionTitles.education || "Education"}
                            </h3>
                            <div className="space-y-4">
                                {education.map(edu => (
                                    <div key={edu.id}>
                                        <div className="font-bold">{edu.school}</div>
                                        <div className="text-xs opacity-80">{edu.degree}</div>
                                        <div className="text-[10px] opacity-60 mt-1">{edu.startDate} – {edu.endDate}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                if (selectedTemplate === 'minimalist') {
                    if (education.length === 0) return null;
                    return (
                        <div key="education" className="mb-8">
                            <h3 className="font-bold uppercase tracking-widest text-xs mb-4">{sectionTitles.education || "Education"}</h3>
                            {education.map(edu => (
                                <div key={edu.id} className="mb-4">
                                    <div className="font-semibold">{edu.school}</div>
                                    <div className="italic text-sm text-gray-600">{edu.degree}</div>
                                    <div className="text-xs text-gray-500 mt-1">{edu.startDate} – {edu.endDate}</div>
                                </div>
                            ))}
                        </div>
                    );
                }
                // Classic / Default
                if (education.length === 0) return null;
                return (
                    <div key="education" className="mb-6">
                        <h3 className="text-lg font-bold uppercase border-b border-gray-200 pb-1 mb-3" style={{ color: themeColor }}>{sectionTitles.education || "Education"}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {education.map(edu => (
                                <div key={edu.id} className="flex items-baseline gap-1.5">
                                    <div className="font-bold text-sm">{edu.school}</div>
                                    <div className="text-sm italic text-gray-700">{edu.degree}</div>
                                    <div className="text-xs text-gray-500">({edu.startDate} – {edu.endDate})</div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'skills':
                if (!skills) return null;
                if (selectedTemplate === 'modern') {
                    return (
                        <div key="skills" className="mb-6">
                            <h3 className="uppercase tracking-widest text-xs font-bold border-b pb-2 mb-4 opacity-80 text-white border-white/30">
                                {sectionTitles.skills || "Skills"}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {skills.map((skill, i) => (
                                    <span key={i} className="px-2 py-1 rounded text-[10px] bg-white/10">
                                        {skill.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                }
                if (selectedTemplate === 'creative') {
                    return (
                        <div key="skills" className="mb-6 text-white">
                            <h3 className="uppercase tracking-widest text-xs font-bold border-b pb-2 mb-4 opacity-80 border-white/20">
                                {sectionTitles.skills || "Skills"}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {skills.map((skill, i) => (
                                    <span key={i} className="px-2 py-1 rounded text-[10px] bg-white/20 font-bold">
                                        {skill.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                }
                if (selectedTemplate === 'minimalist') {
                    if (!skills) return null;
                    return (
                        <div key="skills" className="mb-8">
                            <h3 className="font-bold uppercase tracking-widest text-xs mb-4">{sectionTitles.skills || "Skills"}</h3>
                            <div className="flex flex-wrap gap-2 text-xs">
                                {skills.map((skill, i) => (
                                    <span key={i} className="px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200">
                                        {skill.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                }
                // Classic / Default
                return (
                    <div key="skills" className="mb-6">
                        <h3 className="text-lg font-bold uppercase border-b border-gray-200 pb-1 mb-3" style={{ color: themeColor }}>{sectionTitles.skills || "Skills"}</h3>
                        <div className="flex flex-wrap gap-2 text-xs">
                            {skills.map((skill, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                                    {skill.trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                );

            case 'experience':
                if (experience.length === 0) return null;
                if (selectedTemplate === 'minimalist') {
                    if (experience.length === 0) return null;
                    return (
                        <div key="experience" className="mb-8">
                            <h3 className="font-bold uppercase tracking-widest text-xs mb-4 border-b border-gray-200 pb-1">{sectionTitles.experience || "Professional Experience"}</h3>
                            {experience.map(exp => (
                                <div key={exp.id} className="mb-6">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-bold text-lg">{exp.company}</h4>
                                        <span className="text-xs font-mono text-gray-500">{exp.startDate} – {exp.endDate}</span>
                                    </div>
                                    <div className="text-sm font-medium italic mb-2 text-gray-700">{exp.role}</div>
                                    <FormattedText text={exp.description} className="text-sm leading-relaxed text-gray-600 block" />
                                </div>
                            ))}
                        </div>
                    );
                }
                if (selectedTemplate === 'modern') {
                    if (experience.length === 0) return null;
                    return (
                        <div key="experience">
                            <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b pb-2" style={{ color: themeColor, borderColor: '#e5e7eb' }}>{sectionTitles.experience || "Professional Experience"}</h3>
                            <div className="space-y-6">
                                {experience.map(exp => (
                                    <div key={exp.id} className="relative pl-4 border-l-2 border-gray-100">
                                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: themeColor }}></div>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="font-bold text-gray-900">{exp.company}</h4>
                                            <span className="text-xs text-gray-400 font-medium">{exp.startDate} – {exp.endDate}</span>
                                        </div>
                                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{exp.role}</div>
                                        <FormattedText text={exp.description} className="text-gray-600 text-sm block" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                if (selectedTemplate === 'creative') {
                    if (experience.length === 0) return null;
                    return (
                        <div key="experience" className="mb-8">
                            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2" style={{ color: themeColor }}>
                                {sectionTitles.experience || "Professional Experience"}
                            </h3>
                            <div className="space-y-8">
                                {experience.map(exp => (
                                    <div key={exp.id} className="relative pl-6">
                                        <div className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }}></div>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="text-lg font-bold text-gray-800">{exp.company}</h4>
                                            <span className="text-xs text-gray-400 font-bold">{exp.startDate} - {exp.endDate}</span>
                                        </div>
                                        <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{exp.role}</div>
                                        <FormattedText text={exp.description} className="text-gray-600 text-sm block" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                // Classic
                if (experience.length === 0) return null;
                return (
                    <div key="experience" className="mb-6">
                        <h3 className="text-lg font-bold uppercase border-b border-gray-200 pb-1 mb-4" style={{ color: themeColor }}>{sectionTitles.experience || "Professional Experience"}</h3>
                        <div className="space-y-4">
                            {experience.map(exp => (
                                <div key={exp.id}>
                                    <div className="flex justify-between items-baseline font-bold text-md">
                                        <span>{exp.company}</span>
                                        <span className="text-sm font-normal text-gray-600">{exp.startDate} – {exp.endDate}</span>
                                    </div>
                                    <div className="italic text-sm mb-1" style={{ color: themeColor }}>{exp.role}</div>
                                    <FormattedText text={exp.description} className="text-sm text-gray-700 block" />
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'projects':
                if (projects.length === 0) return null;
                if (selectedTemplate === 'minimalist') {
                    if (projects.length === 0) return null;
                    return (
                        <div key="projects" className="mb-8">
                            <h3 className="font-bold uppercase tracking-widest text-xs mb-4 border-b border-gray-200 pb-1">{sectionTitles.projects || "Projects"}</h3>
                            {projects.map(proj => (
                                <div key={proj.id} className="mb-4">
                                    <div className="flex justify-between items-baseline">
                                        <h4 className="font-bold">{proj.name}</h4>
                                    </div>
                                    {proj.technologies && (
                                        <div className="mt-1 mb-1">
                                            <span className="text-[10px] font-semibold bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 inline-block">
                                                {proj.technologies}
                                            </span>
                                        </div>
                                    )}
                                    <div className="text-sm mt-1 text-gray-600">
                                        <FormattedText text={proj.description} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                }
                if (selectedTemplate === 'modern') {
                    if (projects.length === 0) return null;
                    return (
                        <div key="projects">
                            <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b pb-2" style={{ color: themeColor, borderColor: '#e5e7eb' }}>{sectionTitles.projects || "Projects"}</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {projects.map(proj => (
                                    <div key={proj.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <div className="mb-2">
                                            <h4 className="font-bold text-gray-900">{proj.name}</h4>
                                            {proj.technologies && (
                                                <div className="mt-1.5">
                                                    <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                                        {proj.technologies}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-gray-600 text-sm mb-2">
                                            <FormattedText text={proj.description} />
                                        </div>
                                        {proj.link && (
                                            <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 hover:underline">
                                                View Project &rarr;
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                if (selectedTemplate === 'creative') {
                    if (projects.length === 0) return null;
                    return (
                        <div key="projects" className="mb-8">
                            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2" style={{ color: themeColor }}>
                                {sectionTitles.projects || "Projects"}
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {projects.map(proj => (
                                    <div key={proj.id} className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-bold text-gray-800">{proj.name}</h4>
                                        </div>
                                        {proj.technologies && (
                                            <div className="mb-2 mt-0.5">
                                                <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500 inline-block">
                                                    {proj.technologies}
                                                </span>
                                            </div>
                                        )}
                                        <div className="text-gray-600 text-xs mt-1">
                                            <FormattedText text={proj.description} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                // Classic
                if (projects.length === 0) return null;
                return (
                    <div key="projects" className="mb-6">
                        <h3 className="text-lg font-bold uppercase border-b border-gray-200 pb-1 mb-4" style={{ color: themeColor }}>{sectionTitles.projects || "Projects"}</h3>
                        <div className="space-y-3">
                            {projects.map(proj => (
                                <div key={proj.id}>
                                    <div className="flex justify-between font-bold text-sm">
                                        <span>{proj.name}</span>
                                        {proj.link && <a href={proj.link} className="text-blue-600 font-normal hover:underline text-xs">{proj.linkText || proj.link}</a>}
                                    </div>
                                    {proj.technologies && (
                                        <div className="text-xs text-gray-600 italic mb-1">
                                            {proj.technologies}
                                        </div>
                                    )}
                                    <div className="text-sm text-gray-700">
                                        <FormattedText text={proj.description} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'personal':
                // Usually handled in header, but sometimes has summary
                return null;

            default:
                // Check for custom section
                const customSection = data.customSections?.find(s => s.id === sectionId);
                if (!customSection) return null;

                if (selectedTemplate === 'modern') {
                    return (
                        <div key={customSection.id}>
                            <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b pb-2" style={{ color: themeColor, borderColor: '#e5e7eb' }}>
                                {customSection.title}
                            </h3>
                            <div className="space-y-6">
                                {customSection.items.map(item => (
                                    <div key={item.id} className="relative pl-4 border-l-2 border-gray-100">
                                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: themeColor }}></div>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="font-bold text-gray-900">{item.name}</h4>
                                            <span className="text-xs text-gray-400 font-medium">{item.date}</span>
                                        </div>
                                        {item.city && <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{item.city}</div>}
                                        <FormattedText text={item.description} className="text-gray-600 text-sm whitespace-pre-wrap block" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }

                if (selectedTemplate === 'minimalist') {
                    return (
                        <div key={customSection.id} className="mb-8">
                            <h3 className="font-bold uppercase tracking-widest text-xs mb-4 border-b border-gray-200 pb-1">{customSection.title}</h3>
                            {customSection.items.map(item => (
                                <div key={item.id} className="mb-4">
                                    <div className="flex justify-between items-baseline">
                                        <h4 className="font-bold">{item.name}</h4>
                                        <span className="text-xs text-gray-500">{item.date}</span>
                                    </div>
                                    {item.city && <div className="text-sm italic text-gray-600 mb-1">{item.city}</div>}
                                    <FormattedText text={item.description} className="text-sm mt-1 text-gray-600 whitespace-pre-wrap block" />
                                </div>
                            ))}
                        </div>
                    );
                }

                if (selectedTemplate === 'creative') {
                    return (
                        <div key={customSection.id} className="mb-8">
                            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2" style={{ color: themeColor }}>
                                {customSection.title}
                            </h3>
                            <div className="space-y-4">
                                {customSection.items.map(item => (
                                    <div key={item.id} className="relative pl-6">
                                        <div className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }}></div>
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="text-lg font-bold text-gray-800">{item.name}</h4>
                                            <span className="text-xs text-gray-400 font-bold">{item.date}</span>
                                        </div>
                                        {item.city && <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{item.city}</div>}
                                        <FormattedText text={item.description} className="text-gray-600 text-sm whitespace-pre-wrap block" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }



                // Classic
                return (
                    <div key={customSection.id} className="mb-6">
                        <h3 className="text-lg font-bold uppercase border-b border-gray-200 pb-1 mb-4" style={{ color: themeColor }}>{customSection.title}</h3>
                        <div className="space-y-3">
                            {customSection.items.map(item => (
                                <div key={item.id}>
                                    <div className="flex justify-between font-bold text-sm">
                                        <span>{item.name}</span>
                                        <span className="text-sm font-normal text-gray-600">{item.date}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-1">{item.city}</div>
                                    <FormattedText text={item.description} className="text-sm text-gray-700 whitespace-pre-wrap block" />
                                </div>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    const renderSection = (sectionId: string) => {
        const content = renderSectionContent(sectionId);
        if (!content) return null;
        const scale = sectionScales?.[sectionId] || 1;
        // Cast style to any to avoid TS error with zoom if strict
        return <div key={sectionId} style={{ zoom: scale } as any}>{content}</div>;
    };

    const sectionOrder = data.sectionOrder || ['personal', 'education', 'experience', 'projects', 'skills'];

    // Helper to determine Main vs Sidebar sections for columnar layouts.
    // By default, Education and Skills go to sidebar/left. Everything else (including Custom) goes to Main/Right.
    const sidebarIds = ['education', 'skills'];
    const getSidebarSections = () => sectionOrder.filter(id => sidebarIds.includes(id));
    const getMainSections = () => sectionOrder.filter(id => !sidebarIds.includes(id) && id !== 'personal');

    const ScaledWrapper = ({ children, className = "", style = {} }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) => (
        <div data-template={selectedTemplate} className={cn("w-[794px] h-[1123px] bg-white shadow-2xl mx-auto origin-top-left overflow-hidden flex flex-col border-x-[3px] border-slate-300/80 dark:border-slate-600/80 relative")} style={{ transform: `scale(${scale})` }}>

            <div style={{
                width: `${100 / (contentScale || 1)}%`,
                transform: `scale(${contentScale || 1})`,
                transformOrigin: 'top left',
                ...style,
            }} className={cn("flex-1 flex relative", className)}>
                {children}
            </div>

            {/* Branding - Absolutely positioned to stamp at the bottom of the A4 page regardless of content length */}
            {showBranding && (
                <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-gray-400 font-sans pointer-events-none z-50 bg-white/50 backdrop-blur-[1px] py-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Powered by MyResume
                </div>
            )}
        </div>
    );


    // Helper for shared styles
    const toPx = (pt: number) => `${pt * 1.333}px`;
    const S = RESUME_STYLES; // Alias for brevity

    // 1. Modern Template
    if (selectedTemplate === 'modern') {
        const sidebarSections = getSidebarSections();
        const mainSections = getMainSections();

        return (
            <ScaledWrapper className="flex font-sans" style={{ fontFamily, fontSize: toPx(S.fonts.sizes.body), lineHeight: S.fonts.lineHeight }}>
                {/* Sidebar */}
                <div className="flex flex-col gap-8 min-h-full" style={{
                    width: '32%',
                    backgroundColor: themeColor,
                    padding: `${toPx(S.page.padding)} ${toPx(30)}`, // Adjusted padding for visual balance
                    color: 'white'
                }}>
                    {/* Contact (Fixed) */}
                    <div style={{ zoom: sectionScales?.personal || 1 }}>
                        {(personalInfo.email || personalInfo.phone || personalInfo.location || personalInfo.linkedin || personalInfo.website || personalInfo.github) && (
                            <div className="space-y-4">
                                <h3 style={{
                                    fontSize: toPx(S.fonts.sizes.small),
                                    fontWeight: 'bold',
                                    borderBottom: '1px solid rgba(255,255,255,0.3)',
                                    paddingBottom: toPx(S.spacing.tight),
                                    marginBottom: toPx(S.spacing.item),
                                    textTransform: 'uppercase',
                                    opacity: 0.9,
                                    letterSpacing: '1px'
                                }}>Contact</h3>
                                {personalInfo.email && (
                                    <div className="flex items-center gap-3" style={{ fontSize: toPx(S.fonts.sizes.small) }}>
                                        <Mail className="w-3 h-3 opacity-70" />
                                        <span className="break-all">{personalInfo.email}</span>
                                    </div>
                                )}
                                {personalInfo.phone && (
                                    <div className="flex items-center gap-3" style={{ fontSize: toPx(S.fonts.sizes.small) }}>
                                        <Phone className="w-3 h-3 opacity-70" />
                                        <span>{personalInfo.phone}</span>
                                    </div>
                                )}
                                {personalInfo.location && (
                                    <div className="flex items-center gap-3" style={{ fontSize: toPx(S.fonts.sizes.small) }}>
                                        <MapPin className="w-3 h-3 opacity-70" />
                                        <span>{personalInfo.location}</span>
                                    </div>
                                )}
                                {personalInfo.linkedin && (
                                    <div className="flex items-center gap-3" style={{ fontSize: toPx(S.fonts.sizes.small) }}>
                                        <Linkedin className="w-3 h-3 opacity-70" />
                                        <span className="break-all">{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {sidebarSections.map(renderSection)}
                </div>

                {/* Main Content */}
                <div className="flex flex-col gap-8" style={{
                    width: '68%',
                    padding: `${toPx(S.page.padding)} ${toPx(36)}`,
                    color: S.colors.text
                }}>
                    <div style={{ zoom: sectionScales?.personal || 1 }}>
                        <h1 style={{
                            fontSize: toPx(S.fonts.sizes.h1),
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            color: themeColor,
                            letterSpacing: '-0.5px',
                            lineHeight: 1.2
                        }}>{personalInfo.fullName}</h1>
                        {personalInfo.jobTitle && <p style={{
                            fontSize: toPx(S.fonts.sizes.h3),
                            color: S.colors.textLight,
                            marginTop: toPx(S.spacing.tight),
                            fontWeight: 300
                        }}>{personalInfo.jobTitle}</p>}
                        <div style={{
                            marginTop: toPx(S.spacing.section),
                            fontSize: toPx(S.fonts.sizes.body),
                            lineHeight: S.fonts.lineHeight
                        }}>
                            <FormattedText text={personalInfo.summary} className="block text-gray-600" />
                        </div>
                    </div>

                    {mainSections.map(renderSection)}
                </div>
            </ScaledWrapper>
        );
    }

    // 2. Minimalist Template
    if (selectedTemplate === 'minimalist') {
        const leftSections = getSidebarSections();
        const rightSections = getMainSections();

        return (
            <ScaledWrapper className="px-12 py-12 text-gray-900 font-serif" style={{ fontFamily }}>
                <div className="h-full">
                    <header className="border-b-2 pb-8 mb-8" style={{ borderColor: themeColor, zoom: sectionScales?.personal || 1 }}>
                        <h1 className="text-5xl mb-4 tracking-tighter" style={{ color: themeColor }}>{personalInfo.fullName}</h1>
                        {personalInfo.jobTitle && <p className="text-xl text-gray-400 mb-6 font-light uppercase tracking-widest">{personalInfo.jobTitle}</p>}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            {personalInfo.email && <span>{personalInfo.email}</span>}
                            {personalInfo.phone && <span>• {personalInfo.phone}</span>}
                            {personalInfo.location && <span>• {personalInfo.location}</span>}
                            {personalInfo.website && <span>• {personalInfo.website.replace(/^https?:\/\/(www\.)?/, '')}</span>}
                            {personalInfo.linkedin && <span>• {personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>}
                            {personalInfo.github && <span>• {personalInfo.github.replace(/^https?:\/\/(www\.)?/, '')}</span>}
                        </div>
                    </header>

                    <div className="grid grid-cols-[1fr_2fr] gap-8">
                        <div className="space-y-8">
                            {leftSections.map(renderSection)}
                        </div>

                        <div className="space-y-8">
                            {personalInfo.summary && (
                                <div style={{ zoom: sectionScales?.personal || 1 }}>
                                    <h3 className="font-bold uppercase tracking-widest text-xs mb-3 border-b border-gray-200 pb-1">Profile</h3>
                                    <FormattedText text={personalInfo.summary} className="text-sm leading-relaxed block" />
                                </div>
                            )}
                            {rightSections.map(renderSection)}
                        </div>
                    </div>
                </div>
            </ScaledWrapper>
        )
    }



    // 4. Creative Template
    if (selectedTemplate === "creative") {
        const sidebarSections = getSidebarSections();
        const mainSections = getMainSections();
        return (
            <ScaledWrapper className="flex" style={{ fontFamily }}>
                <div className="w-[35%] px-6 py-8 text-white flex flex-col gap-8 shrink-0 min-h-full" style={{ backgroundColor: themeColor }}>
                    <div style={{ zoom: sectionScales?.personal || 1 }}>
                        <div className="mt-4">
                            <h1 className={cn("font-black uppercase leading-tight mb-2 break-words", personalInfo.fullName.length > 15 ? "text-3xl" : "text-4xl")}>{personalInfo.fullName}</h1>
                            {personalInfo.jobTitle && <p className="text-sm font-bold tracking-widest uppercase opacity-80">{personalInfo.jobTitle}</p>}
                        </div>

                        {(personalInfo.email || personalInfo.phone || personalInfo.location || personalInfo.website || personalInfo.linkedin) && (
                            <div className="space-y-4 mt-8">
                                <h4 className="font-bold uppercase tracking-widest text-xs border-b border-white/20 pb-2 mb-2">Contact</h4>
                                <div className="space-y-2 text-xs font-medium opacity-90">
                                    {personalInfo.email && <div className="break-all">{personalInfo.email}</div>}
                                    {personalInfo.phone && <div>{personalInfo.phone}</div>}
                                    {personalInfo.location && <div>{personalInfo.location}</div>}
                                    {personalInfo.website && <div className="underline decoration-white/50">{personalInfo.website.replace(/^https?:\/\/(www\.)?/, '')}</div>}
                                    {personalInfo.linkedin && <div className="underline decoration-white/50">LinkedIn</div>}
                                    {personalInfo.github && <div className="underline decoration-white/50">GitHub</div>}
                                </div>
                            </div>
                        )}
                    </div>

                    {sidebarSections.map(renderSection)}
                </div>

                <div className="w-[65%] px-10 py-10 pt-16 flex flex-col gap-8">
                    {personalInfo.summary && (
                        <div style={{ zoom: sectionScales?.personal || 1 }}>
                            <h3 className="text-xl font-black uppercase mb-3 flex items-center gap-2" style={{ color: themeColor }}>
                                Profile
                            </h3>
                            <div className="text-gray-600 leading-relaxed font-medium text-sm border-l-4 pl-4 border-gray-100">
                                <FormattedText text={personalInfo.summary} className="block" />
                            </div>
                        </div>
                    )}

                    {mainSections.map(renderSection)}
                </div>
            </ScaledWrapper>
        )
    }









    // 9. Classic Template (Default)
    return (
        <ScaledWrapper className="px-10 py-10 text-gray-800 font-sans" style={{ fontFamily }}>
            <div className="min-h-full flex flex-col relative">
                <div className="text-center border-b-2 border-gray-300 pb-6 mb-6" style={{ zoom: sectionScales?.personal || 1 }}>
                    <h1 className="text-3xl font-bold uppercase tracking-wide mb-2" style={{ color: themeColor }}>{personalInfo.fullName}</h1>
                    {personalInfo.jobTitle && <p className="text-lg text-gray-600 mb-2 uppercase tracking-wide">{personalInfo.jobTitle}</p>}
                    <div className="flex justify-center flex-wrap gap-3 text-sm text-gray-600">
                        {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.website, personalInfo.linkedin, personalInfo.github].filter(Boolean).map((item, i) => (
                            <span key={i} className={i > 0 ? "border-l border-gray-300 pl-3" : ""}>{item}</span>
                        ))}
                    </div>
                </div>

                {personalInfo.summary && (
                    <div className="mb-6" style={{ zoom: sectionScales?.personal || 1 }}>
                        <h3 className="text-lg font-bold uppercase border-b border-gray-200 pb-1 mb-3" style={{ color: themeColor }}>Professional Summary</h3>
                        <FormattedText text={personalInfo.summary} className="text-sm leading-relaxed block" />
                    </div>
                )}

                {/* Render all sections cleanly in simple order */}
                {/* Render all sections cleanly in simple order */}
                {sectionOrder.map(renderSection)}

            </div>
        </ScaledWrapper>
    );
};
