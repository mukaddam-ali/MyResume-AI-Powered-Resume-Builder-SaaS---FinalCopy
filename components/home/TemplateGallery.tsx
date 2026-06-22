"use client";

import { useEffect, useState } from "react";
import { useResumeStore, ResumeData } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";
import { FileText, Copy, Eye, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { TemplatePreviewModal } from "@/components/home/TemplatePreviewModal";

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
    const [previewTemplate, setPreviewTemplate] = useState<PublicTemplate | null>(null);
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
            <div className="mx-auto max-w-[58rem] text-center">
                <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">
                    Community Templates
                </h2>
                <p className="mt-4 text-muted-foreground sm:text-lg">
                    Start with a proven template from our community. Click to customize and make it your own.
                </p>
            </div>

            <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                {templates.map((template) => (
                    <motion.div
                        key={template.id}
                        variants={cardVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        whileHover={{ y: -5 }}
                        className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg truncate">{template.resumeName}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                                        {template.templateType}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                            {template.jobTitle && (
                                <p className="truncate">
                                    <span className="font-medium">Role:</span> {template.jobTitle}
                                </p>
                            )}
                            {template.resumeData.experience?.length > 0 && (
                                <p>
                                    <span className="font-medium">Experience:</span> {template.resumeData.experience.length} {template.resumeData.experience.length === 1 ? 'position' : 'positions'}
                                </p>
                            )}
                            {template.resumeData.projects?.length > 0 && (
                                <p>
                                    <span className="font-medium">Projects:</span> {template.resumeData.projects.length}
                                </p>
                            )}
                            {template.resumeData.personalInfo?.fullName && (
                                <p className="truncate text-xs pt-2 border-t border-border/50">
                                    <span className="font-medium">Published by:</span> {template.resumeData.personalInfo.fullName}
                                </p>
                            )}
                        </div>

                        <div className="mt-6 flex gap-2">
                            <Button
                                id={`template-review-btn-${template.id}`}
                                variant="outline"
                                onClick={() => setPreviewTemplate(template)}
                                className="flex-1 gap-2"
                                size="sm"
                            >
                                <Eye className="h-4 w-4" />
                                Review
                            </Button>
                            <Button
                                id={`template-use-btn-${template.id}`}
                                onClick={() => handleCopyTemplate(template)}
                                className="flex-1 gap-2"
                                size="sm"
                            >
                                <Copy className="h-4 w-4" />
                                Use Template
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Template Preview Modal */}
            <TemplatePreviewModal
                isOpen={!!previewTemplate}
                onClose={() => setPreviewTemplate(null)}
                onUse={() => previewTemplate && handleCopyTemplate(previewTemplate)}
                template={previewTemplate}
            />
        </section>
    );
}

