"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
    Mail, Phone, MapPin, Linkedin, Github, Globe,
    Download, Briefcase, GraduationCap, Code, Wrench,
    ExternalLink, ChevronDown, Star, Award
} from "lucide-react";
import { ResumeData } from "@/store/useResumeStore";
import Link from "next/link";

interface PortfolioPageProps {
    resumeData: ResumeData;
    resumeId: string;
}

const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" as const },
    }),
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
};

export default function PortfolioPage({ resumeData, resumeId }: PortfolioPageProps) {
    const { personalInfo, experience, education, projects, skills, themeColor } = resumeData;
    const accent = themeColor || "#3b82f6";
    const [expandedExp, setExpandedExp] = useState<string | null>(null);

    const downloadUrl = `/api/export-pdf?resumeId=${resumeId}`;

    // Build a readable initials avatar
    const initials = personalInfo.fullName
        ? personalInfo.fullName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
        : "?";

    return (
        <div className="min-h-screen bg-[#0d0d14] text-white font-sans">
            {/* === HERO SECTION === */}
            <section className="relative overflow-hidden">
                {/* Gradient blobs */}
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${accent}55, transparent), radial-gradient(ellipse 60% 50% at 80% 80%, ${accent}33, transparent)`,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d0d14]/30 to-[#0d0d14] pointer-events-none" />

                <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-28 flex flex-col items-center text-center">
                    {/* Avatar */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={0}
                        className="mb-6"
                    >
                        {personalInfo.photo ? (
                            <img
                                src={personalInfo.photo}
                                alt={personalInfo.fullName}
                                className="w-28 h-28 rounded-full object-cover shadow-2xl ring-4 ring-white/10"
                            />
                        ) : (
                            <div
                                className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold shadow-2xl ring-4 ring-white/10"
                                style={{ background: `linear-gradient(135deg, ${accent}cc, ${accent}55)` }}
                            >
                                {initials}
                            </div>
                        )}
                    </motion.div>

                    <motion.h1
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={1}
                        className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-3"
                    >
                        {personalInfo.fullName}
                    </motion.h1>

                    {personalInfo.jobTitle && (
                        <motion.p
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            custom={2}
                            className="text-xl font-medium mb-6"
                            style={{ color: accent }}
                        >
                            {personalInfo.jobTitle}
                        </motion.p>
                    )}

                    {personalInfo.summary && (
                        <motion.p
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            custom={3}
                            className="max-w-2xl text-white/70 text-base leading-relaxed mb-8"
                        >
                            {personalInfo.summary}
                        </motion.p>
                    )}

                    {/* Contact chips */}
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-wrap gap-3 justify-center mb-10"
                    >
                        {personalInfo.email && (
                            <motion.a
                                variants={fadeUp}
                                href={`mailto:${personalInfo.email}`}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/80 transition-all hover:scale-105"
                            >
                                <Mail className="w-3.5 h-3.5" /> {personalInfo.email}
                            </motion.a>
                        )}
                        {personalInfo.phone && (
                            <motion.a
                                variants={fadeUp}
                                href={`tel:${personalInfo.phone}`}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/80 transition-all hover:scale-105"
                            >
                                <Phone className="w-3.5 h-3.5" /> {personalInfo.phone}
                            </motion.a>
                        )}
                        {personalInfo.location && (
                            <motion.span
                                variants={fadeUp}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/80"
                            >
                                <MapPin className="w-3.5 h-3.5" /> {personalInfo.location}
                            </motion.span>
                        )}
                        {personalInfo.linkedin && (
                            <motion.a
                                variants={fadeUp}
                                href={personalInfo.linkedin.startsWith("http") ? personalInfo.linkedin : `https://${personalInfo.linkedin}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/80 transition-all hover:scale-105"
                            >
                                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                            </motion.a>
                        )}
                        {personalInfo.github && (
                            <motion.a
                                variants={fadeUp}
                                href={personalInfo.github.startsWith("http") ? personalInfo.github : `https://github.com/${personalInfo.github}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/80 transition-all hover:scale-105"
                            >
                                <Github className="w-3.5 h-3.5" /> GitHub
                            </motion.a>
                        )}
                        {personalInfo.website && (
                            <motion.a
                                variants={fadeUp}
                                href={personalInfo.website.startsWith("http") ? personalInfo.website : `https://${personalInfo.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/80 transition-all hover:scale-105"
                            >
                                <Globe className="w-3.5 h-3.5" /> Website
                            </motion.a>
                        )}
                    </motion.div>

                    {/* CTA Button */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={5}
                        className="flex gap-4 flex-wrap justify-center"
                    >
                        <a
                            href={downloadUrl}
                            className="flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
                            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
                        >
                            <Download className="w-4 h-4" />
                            Download PDF Resume
                        </a>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 0.5 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2"
                    >
                        <ChevronDown className="w-5 h-5 text-white/30 animate-bounce" />
                    </motion.div>
                </div>
            </section>

            {/* === MAIN CONTENT === */}
            <div className="max-w-5xl mx-auto px-6 pb-24 space-y-24">

                {/* === EXPERIENCE === */}
                {experience && experience.length > 0 && (
                    <motion.section
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                    >
                        <SectionHeader icon={<Briefcase className="w-5 h-5" />} title="Experience" accent={accent} />
                        <div className="mt-8 relative">
                            {/* Timeline line */}
                            <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10 ml-4" />

                            <div className="space-y-0">
                                {experience.map((exp, i) => (
                                    <motion.div
                                        key={exp.id}
                                        variants={fadeUp}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true }}
                                        custom={i}
                                        className="relative pl-12 pb-10"
                                    >
                                        {/* Timeline dot */}
                                        <div
                                            className="absolute left-0 top-1.5 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-4 ring-[#0d0d14]"
                                            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}88)` }}
                                        >
                                            <Briefcase className="w-3.5 h-3.5 text-white" />
                                        </div>

                                        <div
                                            className="p-6 rounded-2xl border border-white/8 hover:border-white/15 transition-all duration-300 cursor-pointer group"
                                            style={{ background: "rgba(255,255,255,0.03)" }}
                                            onClick={() => setExpandedExp(expandedExp === exp.id ? null : exp.id)}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                                <div>
                                                    <h3 className="font-bold text-lg text-white group-hover:text-white/90">{exp.role}</h3>
                                                    <p className="text-sm font-medium" style={{ color: accent }}>{exp.company}</p>
                                                </div>
                                                <span className="text-xs text-white/40 shrink-0 mt-1 font-mono">
                                                    {exp.startDate}{exp.startDate && (exp.endDate || exp.current) ? " – " : ""}{exp.current ? "Present" : exp.endDate}
                                                </span>
                                            </div>

                                            {exp.description && (
                                                <motion.div
                                                    initial={false}
                                                    animate={{ height: expandedExp === exp.id || i === 0 ? "auto" : "3.5rem", overflow: "hidden" }}
                                                    className="mt-3 text-sm text-white/60 leading-relaxed"
                                                >
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: exp.description
                                                                .replace(/• /g, "")
                                                                .split("\n")
                                                                .filter(Boolean)
                                                                .map(line => `<div class="flex gap-2 mb-1.5"><span style="color:${accent};margin-top:6px;flex-shrink:0">▸</span><span>${line}</span></div>`)
                                                                .join(""),
                                                        }}
                                                    />
                                                </motion.div>
                                            )}

                                            {exp.description && exp.description.split("\n").filter(Boolean).length > 2 && (
                                                <button
                                                    className="mt-2 text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedExp(expandedExp === exp.id ? null : exp.id);
                                                    }}
                                                >
                                                    <ChevronDown className={`w-3 h-3 transition-transform ${expandedExp === exp.id ? "rotate-180" : ""}`} />
                                                    {expandedExp === exp.id ? "Show less" : "Show more"}
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* === EDUCATION === */}
                {education && education.length > 0 && (
                    <motion.section
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                    >
                        <SectionHeader icon={<GraduationCap className="w-5 h-5" />} title="Education" accent={accent} />
                        <div className="mt-8 grid sm:grid-cols-2 gap-4">
                            {education.map((edu, i) => (
                                <motion.div
                                    key={edu.id}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    custom={i}
                                    className="p-6 rounded-2xl border border-white/8 hover:border-white/15 transition-all duration-300"
                                    style={{ background: "rgba(255,255,255,0.03)" }}
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                                        style={{ background: `${accent}22` }}
                                    >
                                        <GraduationCap className="w-5 h-5" style={{ color: accent }} />
                                    </div>
                                    <h3 className="font-bold text-white">{edu.school}</h3>
                                    {edu.degree && <p className="text-sm text-white/60 mt-1">{edu.degree}</p>}
                                    <p className="text-xs text-white/30 mt-2 font-mono">
                                        {edu.startDate}{edu.startDate && edu.endDate ? " – " : ""}{edu.current ? "Present" : edu.endDate}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* === PROJECTS === */}
                {projects && projects.length > 0 && (
                    <motion.section
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                    >
                        <SectionHeader icon={<Code className="w-5 h-5" />} title="Projects" accent={accent} />
                        <div className="mt-8 grid sm:grid-cols-2 gap-4">
                            {projects.map((proj, i) => (
                                <motion.div
                                    key={proj.id}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    custom={i}
                                    className="group p-6 rounded-2xl border border-white/8 hover:border-white/20 transition-all duration-300 flex flex-col"
                                    style={{ background: "rgba(255,255,255,0.03)" }}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <h3 className="font-bold text-white group-hover:text-white/90">{proj.name}</h3>
                                        {proj.link && (
                                            <a
                                                href={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70" />
                                            </a>
                                        )}
                                    </div>
                                    {proj.description && (
                                        <p className="text-sm text-white/55 leading-relaxed flex-1">{proj.description}</p>
                                    )}
                                    {proj.technologies && (
                                        <div className="flex flex-wrap gap-1.5 mt-4">
                                            {proj.technologies.split(",").map((tech, ti) => (
                                                <span
                                                    key={ti}
                                                    className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                                                    style={{ background: `${accent}22`, color: accent }}
                                                >
                                                    {tech.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* === SKILLS === */}
                {skills && skills.length > 0 && (
                    <motion.section
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                    >
                        <SectionHeader icon={<Wrench className="w-5 h-5" />} title="Skills" accent={accent} />
                        <div className="mt-8 flex flex-wrap gap-3">
                            {skills.map((skill, i) => (
                                <motion.span
                                    key={i}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    custom={i * 0.5}
                                    className="px-4 py-2 rounded-full text-sm font-medium border border-white/10 hover:border-white/25 transition-all hover:scale-105"
                                    style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.8)" }}
                                >
                                    {skill}
                                </motion.span>
                            ))}
                        </div>
                    </motion.section>
                )}
            </div>

            {/* === FOOTER === */}
            <footer className="border-t border-white/8 py-8">
                <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-white/30">
                        © {new Date().getFullYear()} {personalInfo.fullName}
                    </p>
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-xs text-white/25 hover:text-white/50 transition-colors group"
                    >
                        <Star className="w-3 h-3 group-hover:text-yellow-400 transition-colors" />
                        Built with <span className="font-semibold text-white/40">MyResume</span>
                    </Link>
                </div>
            </footer>
        </div>
    );
}

function SectionHeader({ icon, title, accent }: { icon: React.ReactNode; title: string; accent: string }) {
    return (
        <div className="flex items-center gap-3">
            <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${accent}22`, color: accent }}
            >
                {icon}
            </div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <div className="flex-1 h-px bg-white/8 ml-2" />
        </div>
    );
}
