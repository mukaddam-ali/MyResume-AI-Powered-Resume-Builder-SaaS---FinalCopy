"use client";

/**
 * Premium portfolio page — a data-driven port of the portfolioDesing-3 repo.
 * Layout, spacing, typography, and interactions mirror the original design;
 * all content comes from the published resume data.
 */

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowRight, Github, Linkedin, Mail, Phone, MapPin, Globe,
    ExternalLink, Menu, X, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { ResumeData, Project } from "@/store/useResumeStore";
import { toPlainLines } from "@/lib/ats/metrics";

interface PortfolioProProps {
    resumeData: ResumeData;
    resumeId: string;
}

const ensureUrl = (url: string) =>
    /^https?:\/\//i.test(url) ? url : `https://${url}`;

// ─── Header ──────────────────────────────────────────────────────────────────
function Header({ name, photo, sections }: { name: string; photo?: string; sections: { id: string; label: string }[] }) {
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [menuOpen, setMenuOpen] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const initials = name
        ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
        : "?";

    return (
        <header
            className={`fixed top-0 z-50 w-full border-b transition-colors duration-300 ${isScrolled
                ? "border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                : "border-transparent bg-transparent"}`}
        >
            <div className="container mx-auto px-4 flex h-16 items-center justify-between">
                <Link href="#top" className="flex items-center space-x-3">
                    {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt={name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                            {initials}
                        </div>
                    )}
                    <span className="font-bold hidden sm:inline">{name}</span>
                </Link>

                <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                    {sections.map((item) => (
                        <a
                            key={item.id}
                            href={`#${item.id}`}
                            className="transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center justify-end space-x-2">
                    <ModeToggle />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
            {menuOpen && (
                <div className="md:hidden border-t bg-background/95 backdrop-blur px-4 py-4 flex flex-col space-y-3">
                    {sections.map((item) => (
                        <a
                            key={item.id}
                            href={`#${item.id}`}
                            onClick={() => setMenuOpen(false)}
                            className="text-lg font-medium text-foreground/60 hover:text-foreground"
                        >
                            {item.label}
                        </a>
                    ))}
                </div>
            )}
        </header>
    );
}

// ─── Hero ────────────────────────────────────────────────────────────────────
function Hero({ data }: { data: ResumeData }) {
    const { personalInfo } = data;
    return (
        <section id="top" className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16 px-4">
            <div className="absolute top-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[100px]" />
            <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-[100px]" />

            <div className="container relative z-10 mx-auto max-w-5xl text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {personalInfo.jobTitle && (
                        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                            {personalInfo.jobTitle}
                        </h2>
                    )}
                    <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-7xl">
                        Hi, I&apos;m{" "}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                            {personalInfo.fullName}
                        </span>
                    </h1>
                    {personalInfo.summary && (
                        <p className="mb-8 mx-auto max-w-2xl text-xl text-muted-foreground">
                            {toPlainLines(personalInfo.summary).join(" ")}
                        </p>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-col items-center justify-center gap-4 sm:flex-row"
                >
                    {(data.projects?.length || 0) > 0 && (
                        <Button asChild size="lg" className="min-w-[160px]">
                            <a href="#projects">
                                View Projects <ArrowRight className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    )}
                    <Button asChild variant="outline" size="lg" className="min-w-[160px]">
                        <a href="#contact">Contact Me</a>
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-12 flex justify-center gap-6"
                >
                    {personalInfo.github && (
                        <a href={ensureUrl(personalInfo.github)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                            <Github className="h-6 w-6" />
                            <span className="sr-only">GitHub</span>
                        </a>
                    )}
                    {personalInfo.linkedin && (
                        <a href={ensureUrl(personalInfo.linkedin)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                            <Linkedin className="h-6 w-6" />
                            <span className="sr-only">LinkedIn</span>
                        </a>
                    )}
                    {personalInfo.website && (
                        <a href={ensureUrl(personalInfo.website)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                            <Globe className="h-6 w-6" />
                            <span className="sr-only">Website</span>
                        </a>
                    )}
                    {personalInfo.email && (
                        <a href={`mailto:${personalInfo.email}`} className="text-muted-foreground hover:text-primary transition-colors">
                            <Mail className="h-6 w-6" />
                            <span className="sr-only">Email</span>
                        </a>
                    )}
                </motion.div>
            </div>
        </section>
    );
}

// ─── Projects ────────────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
    const technologies = (project.technologies || "")
        .split(",").map(t => t.trim()).filter(Boolean);
    const description = toPlainLines(project.description).join(" ");

    return (
        <Card className="group overflow-hidden border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-md">
            <div className="relative aspect-video overflow-hidden">
                <div className="absolute inset-0 bg-muted/50 flex items-center justify-center text-muted-foreground">
                    {project.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={project.image}
                            alt={project.name}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <span>No Image</span>
                    )}
                </div>
            </div>
            <CardHeader>
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-xl font-bold">{project.name}</CardTitle>
                    {project.category && <Badge variant="secondary">{project.category}</Badge>}
                </div>
                {description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {technologies.map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                        </Badge>
                    ))}
                </div>
            </CardContent>
            {project.link && (
                <CardFooter className="gap-2">
                    <Button asChild variant="outline" size="sm" className="w-full">
                        <a href={ensureUrl(project.link)} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" /> {project.linkText || "View Project"}
                        </a>
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}

function Projects({ projects }: { projects: Project[] }) {
    const categories = React.useMemo(() => {
        const set = new Set<string>();
        for (const p of projects) if (p.category) set.add(p.category);
        return ["All", ...[...set]];
    }, [projects]);

    const [selectedCategory, setSelectedCategory] = React.useState("All");
    const filtered = projects.filter(
        (p) => selectedCategory === "All" || p.category === selectedCategory
    );

    return (
        <section id="projects" className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Featured Projects</h2>
                    <div className="w-20 h-1 bg-primary rounded-full mb-8" />

                    {categories.length > 1 && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {categories.map((category) => (
                                <Button
                                    key={category}
                                    variant={selectedCategory === category ? "default" : "outline"}
                                    onClick={() => setSelectedCategory(category)}
                                    className="rounded-full"
                                >
                                    {category}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Skills ──────────────────────────────────────────────────────────────────
function Skills({ skills }: { skills: string[] }) {
    // The design shows three category cards; split the skill list evenly.
    const columns = React.useMemo(() => {
        const clean = skills.filter(s => s && s.trim());
        const n = Math.min(3, Math.max(1, Math.ceil(clean.length / 5)));
        const cols: string[][] = Array.from({ length: n }, () => []);
        clean.forEach((s, i) => cols[i % n].push(s));
        return cols;
    }, [skills]);

    return (
        <section id="skills" className="py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Technical Skills</h2>
                    <div className="w-20 h-1 bg-primary rounded-full mx-auto" />
                </div>

                <div className={`grid grid-cols-1 gap-8 ${columns.length === 3 ? "md:grid-cols-3" : columns.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "max-w-xl mx-auto"}`}>
                    {columns.map((items, idx) => (
                        <div key={idx} className="p-6 rounded-lg border bg-card">
                            <div className="flex flex-wrap gap-2 justify-center">
                                {items.map((skill) => (
                                    <motion.div
                                        key={skill}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Badge variant="secondary" className="text-sm py-1.5 px-3">
                                            {skill}
                                        </Badge>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Experience ──────────────────────────────────────────────────────────────
function Experience({ data }: { data: ResumeData }) {
    return (
        <section id="experience" className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">Experience</h2>
                <div className="max-w-3xl mx-auto space-y-8">
                    {data.experience.map((exp) => (
                        <div key={exp.id} className="relative pl-8 border-l-2 border-primary/30 last:border-0">
                            <div className="absolute top-0 left-[-9px] w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
                            <Card className="border-none shadow-none bg-transparent">
                                <CardHeader className="p-0 pb-2">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                                        <CardTitle className="text-xl font-bold">{exp.role}</CardTitle>
                                        <span className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded whitespace-nowrap">
                                            {exp.startDate} - {exp.endDate}
                                        </span>
                                    </div>
                                    <div className="text-lg font-medium text-primary">{exp.company}</div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <ul className="space-y-1.5 text-muted-foreground">
                                        {toPlainLines(exp.description).map((line, i) => (
                                            <li key={i}>{line}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Education (+ custom sections in the same card style) ───────────────────
function Education({ data }: { data: ResumeData }) {
    const visible = (id: string) => (data.sectionOrder || []).includes(id);
    const customSections = (data.customSections || []).filter(cs => visible(cs.id));

    return (
        <section id="education" className="py-20">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">Education</h2>
                <div className="max-w-3xl mx-auto">
                    {data.education.map((edu) => (
                        <Card key={edu.id} className="mb-8">
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-xl font-bold">{edu.school}</CardTitle>
                                        <div className="text-lg text-primary mt-1">{edu.degree}</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm font-medium whitespace-nowrap">
                                            {edu.startDate} - {edu.endDate}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}

                    {customSections.map((cs) => (
                        <Card key={cs.id} className="mb-8">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold">{cs.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {cs.items.map((item) => (
                                        <li key={item.id}>
                                            <div className="flex justify-between gap-2">
                                                <span className="font-medium">{item.name}</span>
                                                {item.date && <span className="text-sm text-muted-foreground whitespace-nowrap">{item.date}</span>}
                                            </div>
                                            {item.description && (
                                                <p className="text-sm text-muted-foreground mt-0.5">
                                                    {toPlainLines(item.description).join(" ")}
                                                </p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Contact ─────────────────────────────────────────────────────────────────
function Contact({ data }: { data: ResumeData }) {
    const { personalInfo } = data;
    const [sending, setSending] = React.useState(false);
    const [form, setForm] = React.useState({ name: "", email: "", subject: "", message: "" });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!personalInfo.email) return;
        setSending(true);
        const mailto = `mailto:${personalInfo.email}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`)}`;
        window.location.href = mailto;
        setTimeout(() => setSending(false), 800);
    };

    return (
        <section id="contact" className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Get In Touch</h2>
                    <p className="text-muted-foreground">
                        Have a project in mind or just want to say hi? Send me a message!
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        {personalInfo.email && (
                            <div className="flex items-start space-x-4">
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Email</h3>
                                    <p className="text-muted-foreground break-all">{personalInfo.email}</p>
                                </div>
                            </div>
                        )}
                        {personalInfo.phone && (
                            <div className="flex items-start space-x-4">
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    <Phone className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Phone</h3>
                                    <p className="text-muted-foreground">{personalInfo.phone}</p>
                                </div>
                            </div>
                        )}
                        {personalInfo.location && (
                            <div className="flex items-start space-x-4">
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Location</h3>
                                    <p className="text-muted-foreground">{personalInfo.location}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {personalInfo.email && (
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="Your name"
                                    className="h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    aria-label="Your name"
                                />
                                <input
                                    required
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    placeholder="Your email"
                                    className="h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    aria-label="Your email"
                                />
                            </div>
                            <input
                                required
                                value={form.subject}
                                onChange={e => setForm({ ...form, subject: e.target.value })}
                                placeholder="Subject"
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                aria-label="Subject"
                            />
                            <textarea
                                required
                                rows={5}
                                value={form.message}
                                onChange={e => setForm({ ...form, message: e.target.value })}
                                placeholder="Your message…"
                                className="w-full rounded-md border bg-background p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                                aria-label="Your message"
                            />
                            <Button type="submit" disabled={sending} className="w-full" size="lg">
                                {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                {sending ? "Opening email client…" : "Send Message"}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer({ data }: { data: ResumeData }) {
    const { personalInfo } = data;
    return (
        <footer className="border-t bg-background w-full">
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    <p className="text-sm text-muted-foreground text-center md:text-left">
                        © {new Date().getFullYear()} {personalInfo.fullName}. All rights reserved.
                        <span className="mx-2">·</span>
                        <Link href="/" className="hover:text-foreground transition-colors">Built with MyResume</Link>
                    </p>
                    <div className="flex items-center gap-4">
                        {personalInfo.github && (
                            <a href={ensureUrl(personalInfo.github)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Github className="h-5 w-5" />
                                <span className="sr-only">GitHub</span>
                            </a>
                        )}
                        {personalInfo.linkedin && (
                            <a href={ensureUrl(personalInfo.linkedin)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                                <Linkedin className="h-5 w-5" />
                                <span className="sr-only">LinkedIn</span>
                            </a>
                        )}
                        {personalInfo.email && (
                            <a href={`mailto:${personalInfo.email}`} className="text-muted-foreground hover:text-foreground transition-colors">
                                <Mail className="h-5 w-5" />
                                <span className="sr-only">Email</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function PortfolioPro({ resumeData }: PortfolioProProps) {
    const visible = (id: string) => (resumeData.sectionOrder || []).includes(id);
    const hasProjects = visible('projects') && (resumeData.projects?.length || 0) > 0;
    const hasSkills = visible('skills') && (resumeData.skills?.length || 0) > 0;
    const hasExperience = visible('experience') && (resumeData.experience?.length || 0) > 0;
    const hasEducation = (visible('education') && (resumeData.education?.length || 0) > 0)
        || (resumeData.customSections || []).some(cs => visible(cs.id));

    const navSections = [
        ...(hasProjects ? [{ id: "projects", label: "Projects" }] : []),
        ...(hasSkills ? [{ id: "skills", label: "Skills" }] : []),
        ...(hasExperience ? [{ id: "experience", label: "Experience" }] : []),
        { id: "contact", label: "Contact" },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header
                name={resumeData.personalInfo.fullName}
                photo={resumeData.personalInfo.photo}
                sections={navSections}
            />
            <main className="flex flex-col min-h-screen">
                <Hero data={resumeData} />
                {hasProjects && <Projects projects={resumeData.projects} />}
                {hasSkills && <Skills skills={resumeData.skills} />}
                {hasExperience && <Experience data={resumeData} />}
                {hasEducation && <Education data={resumeData} />}
                <Contact data={resumeData} />
            </main>
            <Footer data={resumeData} />
        </div>
    );
}
