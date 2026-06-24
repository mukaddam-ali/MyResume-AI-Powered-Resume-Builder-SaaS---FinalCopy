"use client";

import { useEffect, useState } from "react";
import { useResumeStore, ResumeData } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";
import { FileText, Copy, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import LiveResume to avoid SSR/hydration issues
const LiveResume = dynamic(() => import("@/components/preview/LiveResume"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-muted/20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    ),
});

interface PublicTemplate {
    id: string;
    resumeId: string;
    userId: string;
    resumeData: ResumeData;
    resumeName: string;
    templateType: string;
    jobTitle: string | null;
    createdAt: string;
}

export function TemplateGallery() {
    const router = useRouter();
    const [templates, setTemplates] = useState<PublicTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visibleTemplatesCount, setVisibleTemplatesCount] = useState(6);
    const { resumes, setActiveResume } = useResumeStore();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/templates');
            const data = await response.json();

            if (response.ok) {
                setTemplates(data.templates || []);
                setError(null);
            } else {
                setError(data.error || 'Failed to load templates');
            }
        } catch (err) {
            setError('Failed to connect to server');
            console.error('Error fetching templates:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyTemplate = (template: PublicTemplate) => {
        const newId = crypto.randomUUID();
        const newResume: ResumeData = {
            ...template.resumeData,
            id: newId,
            name: `${template.resumeName} (Copy)`,
            isPublic: false,
            lastModified: Date.now(),
            analysisResult: null
        };

        // Add to store and navigate
        useResumeStore.setState((state) => ({
            resumes: { ...state.resumes, [newId]: newResume },
            activeResumeId: newId
        }));

        router.push('/editor');
    };

    // Don't show section if loading or no templates
    if (loading) {
        return (
            <section className="w-full py-24 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </section>
        );
    }

    if (error) {
        return (
            <section className="w-full py-24">
                <div className="mx-auto max-w-[58rem] text-center">
                    <p className="text-sm text-muted-foreground">
                        Unable to load community templates. {error}
                    </p>
                </div>
            </section>
        );
    }

    if (templates.length === 0) {
        return null; // Don't show section if no public templates
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" } as any
        }
    };

    return (
        <section id="templates" className="w-full space-y-16 py-24 md:py-32 bg-slate-50 dark:bg-slate-900/50">
            <div className="mx-auto max-w-[58rem] text-center px-4">
                <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">
                    Community Templates
                </h2>
                <p className="mt-4 text-muted-foreground sm:text-lg">
                    Start with a proven template from our community. Click to customize and make it your own.
                </p>
            </div>

            {/* Responsive grid displaying exactly 3 columns per row on desktop (lg and up) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
                {templates.slice(0, visibleTemplatesCount).map((template) => (
                    <motion.div
                        key={template.id}
                        variants={cardVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        whileHover={{ y: -5 }}
                        className="relative overflow-hidden rounded-xl border bg-background flex flex-col hover:shadow-lg transition-shadow duration-300"
                    >
                        {/* Visual Template Preview Area */}
                        <div 
                            className="relative w-full h-[360px] bg-slate-50 dark:bg-zinc-900/30 overflow-hidden border-b border-border flex items-center justify-center cursor-pointer group"
                            onClick={() => handleCopyTemplate(template)}
                        >
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300 z-10 flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-all duration-300 flex items-center gap-1.5 hover:bg-primary/95">
                                    <Copy className="h-4 w-4" /> Use Template
                                </span>
                            </div>

                            {/* Scaled resume footprint wrapper */}
                            <div 
                                style={{
                                    width: `${794 * 0.30}px`,
                                    height: `${1123 * 0.30}px`,
                                    position: "relative",
                                    overflow: "hidden"
                                }}
                                className="shadow-md border border-border bg-white select-none pointer-events-none shrink-0"
                            >
                                <div
                                    style={{
                                        transform: "scale(0.30)",
                                        transformOrigin: "top left",
                                        width: "794px",
                                        height: "1123px",
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                    }}
                                >
                                    <LiveResume data={template.resumeData} scale={1} />
                                </div>
                            </div>
                        </div>

                        {/* Card metadata details and CTA action */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-lg truncate text-foreground" title={template.resumeName}>
                                            {template.resumeName}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">
                                                {template.templateType}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 text-xs text-muted-foreground">
                                    {template.jobTitle && (
                                        <p className="truncate">
                                            <span className="font-semibold text-foreground/80">Role:</span> {template.jobTitle}
                                        </p>
                                    )}
                                    {template.resumeData.experience?.length > 0 && (
                                        <p>
                                            <span className="font-semibold text-foreground/80">Experience:</span> {template.resumeData.experience.length} {template.resumeData.experience.length === 1 ? 'position' : 'positions'}
                                        </p>
                                    )}
                                    {template.resumeData.projects?.length > 0 && (
                                        <p>
                                            <span className="font-semibold text-foreground/80">Projects:</span> {template.resumeData.projects.length}
                                        </p>
                                    )}
                                    {template.resumeData.personalInfo?.fullName && (
                                        <p className="truncate text-[10px] pt-2 border-t border-border/40 mt-2">
                                            <span className="font-semibold text-foreground/70">Published by:</span> {template.resumeData.personalInfo.fullName}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-5">
                                <Button
                                    id={`template-use-btn-${template.id}`}
                                    onClick={() => handleCopyTemplate(template)}
                                    className="w-full gap-2 h-10 shadow-sm"
                                >
                                    <Copy className="h-4 w-4" />
                                    Use This Template
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {templates.length > visibleTemplatesCount && (
                <div className="flex justify-center mt-12">
                    <Button 
                        onClick={() => setVisibleTemplatesCount(prev => prev + 6)}
                        variant="outline"
                        size="lg"
                        className="shadow-sm gap-2"
                    >
                        Load More Templates
                    </Button>
                </div>
            )}
        </section>
    );
}
