"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResumeStore } from "@/store/useResumeStore";

// ─── Types ──────────────────────────────────────────────────────────────────

type UploadStep = "idle" | "reading" | "analyzing" | "building" | "done" | "error";

const STEPS: Record<string, { label: string; sub: string }> = {
    reading: { label: "Reading PDF…", sub: "Extracting text content from your resume" },
    analyzing: { label: "AI Analyzing…", sub: "Gemini is identifying all sections and content" },
    building: { label: "Building Resume…", sub: "Populating your editor with the parsed data" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ImportResumeButton() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<UploadStep>("idle");
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    // ── Drag handlers ──────────────────────────────────────────────────────
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    }, []);

    // ── Core upload & parse logic ──────────────────────────────────────────
    const processFile = async (file: File) => {
        setError(null);
        setFileName(file.name);

        if (file.type !== "application/pdf") {
            setError("Please upload a PDF file.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError("File is too large. Maximum size is 10 MB.");
            return;
        }

        try {
            // Step 1: Reading
            setStep("reading");
            await new Promise(r => setTimeout(r, 600)); // UX: let the state animate in

            const formData = new FormData();
            formData.append("file", file);

            // Step 2: Analyzing (API call happens here)
            setStep("analyzing");
            const res = await fetch("/api/ai/parse-resume", {
                method: "POST",
                body: formData,
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.error ?? "Failed to parse resume. Please try again.");
            }

            // Step 3: Building
            setStep("building");
            await new Promise(r => setTimeout(r, 500)); // UX: let the state animate in

            const parsed = json.data;

            // Create a new resume entry in the Zustand store
            const newId = crypto.randomUUID();
            const baseName = file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");

            const newResume = {
                id: newId,
                name: baseName || "Imported Resume",
                lastModified: Date.now(),
                selectedTemplate: "classic" as const,
                themeColor: "#112e51",
                contentScale: 1,
                fontFamily: "roboto",
                sectionScales: {},
                sectionTitles: {},
                isPublic: false,
                analysisResult: null,

                // AI-parsed data
                personalInfo: {
                    fullName: parsed.personalInfo?.fullName ?? "",
                    jobTitle: parsed.personalInfo?.jobTitle ?? "",
                    email: parsed.personalInfo?.email ?? "",
                    phone: parsed.personalInfo?.phone ?? "",
                    location: parsed.personalInfo?.location ?? "",
                    linkedin: parsed.personalInfo?.linkedin ?? "",
                    website: parsed.personalInfo?.website ?? "",
                    github: parsed.personalInfo?.github ?? "",
                    summary: parsed.personalInfo?.summary ?? "",
                    photoFilters: {
                        scale: 1,
                        brightness: 1,
                        contrast: 1,
                        grayscale: 0,
                        borderWidth: 0,
                        borderColor: "#ffffff",
                    },
                },
                education: (parsed.education ?? []).map((edu: any) => ({
                    id: crypto.randomUUID(),
                    school: edu.school ?? "",
                    degree: edu.degree ?? "",
                    startDate: edu.startDate ?? "",
                    endDate: edu.endDate ?? "",
                    current: edu.current ?? false,
                })),
                experience: (parsed.experience ?? []).map((exp: any) => ({
                    id: crypto.randomUUID(),
                    company: exp.company ?? "",
                    role: exp.role ?? "",
                    startDate: exp.startDate ?? "",
                    endDate: exp.endDate ?? "",
                    current: exp.current ?? false,
                    description: exp.description ?? "",
                })),
                projects: (parsed.projects ?? []).map((proj: any) => ({
                    id: crypto.randomUUID(),
                    name: proj.name ?? "",
                    description: proj.description ?? "",
                    technologies: proj.technologies ?? "",
                    link: proj.link ?? "",
                })),
                skills: parsed.skills ?? [],
                // Build custom sections FIRST so we can reference real IDs in sectionOrder
                customSections: [] as any[], // filled below
                sectionOrder: [] as string[],            // filled below
            };

            // Generate custom sections with stable IDs
            const customSections = (parsed.customSections ?? []).map((cs: any) => ({
                id: `custom-${crypto.randomUUID().slice(0, 8)}`,
                title: cs.title ?? "Other",
                items: (cs.items ?? []).map((item: any) => ({
                    id: crypto.randomUUID(),
                    name: item.name ?? "",
                    description: item.description ?? "",
                    date: item.date ?? "",
                    city: item.city ?? "",
                })),
            }));

            newResume.customSections = customSections;
            newResume.sectionOrder = buildSectionOrder(parsed, customSections.map((cs: any) => cs.id));

            // Inject into store
            useResumeStore.setState((state) => ({
                resumes: { ...state.resumes, [newId]: newResume },
                activeResumeId: newId,
            }));

            setStep("done");
            await new Promise(r => setTimeout(r, 800));

            // Navigate to editor
            router.push("/editor?imported=true");

        } catch (err: any) {
            console.error("Import error:", err);
            setError(err?.message ?? "Something went wrong. Please try again.");
            setStep("error");
        }
    };

    // Build a smart section order based on what fields were actually found
    const buildSectionOrder = (parsed: any, customSectionIds: string[] = []): string[] => {
        const order: string[] = ["personal"];
        if (parsed.experience?.length > 0) order.push("experience");
        if (parsed.education?.length > 0) order.push("education");
        if (parsed.projects?.length > 0) order.push("projects");
        if (parsed.skills?.length > 0) order.push("skills");
        // Append real custom section IDs in detected order
        customSectionIds.forEach((id) => order.push(id));
        return order;
    };

    const reset = () => {
        setStep("idle");
        setError(null);
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const isProcessing = ["reading", "analyzing", "building"].includes(step);
    const currentStepInfo = STEPS[step] ?? null;

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="w-full">
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                id="resume-pdf-input"
                onChange={(e) => {
                    e.stopPropagation();
                    const file = e.target.files?.[0];
                    if (file) processFile(file);
                    // Reset input so same file can be re-selected
                    e.target.value = "";
                }}
                onClick={(e) => e.stopPropagation()}
            />

            <AnimatePresence mode="wait">

                {/* ── IDLE: Drop zone ── */}
                {step === "idle" && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            fileInputRef.current?.click();
                        }}
                        className={`
                            relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center
                            transition-all duration-200 select-none
                            ${isDragging
                                ? "border-primary bg-primary/10 scale-[1.02]"
                                : "border-border hover:border-primary/60 hover:bg-primary/5"
                            }
                        `}
                    >
                        <div className="flex flex-col items-center gap-3">
                            <div className={`
                                flex h-14 w-14 items-center justify-center rounded-full transition-colors
                                ${isDragging ? "bg-primary/20" : "bg-muted"}
                            `}>
                                <Upload className={`h-6 w-6 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">
                                    {isDragging ? "Drop your resume here" : "Drag & drop your PDF here"}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    or <span className="text-primary font-medium">click to browse</span> — PDF only, max 10 MB
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── PROCESSING: Animated steps ── */}
                {isProcessing && currentStepInfo && (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-2xl border bg-muted/40 p-8"
                    >
                        <div className="flex flex-col items-center gap-4">
                            {/* File name pill */}
                            {fileName && (
                                <div className="flex items-center gap-2 rounded-full bg-background border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                                    <FileText className="h-3.5 w-3.5 text-primary" />
                                    <span className="max-w-[200px] truncate">{fileName}</span>
                                </div>
                            )}

                            {/* Spinner */}
                            <div className="relative flex h-16 w-16 items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                            </div>

                            {/* Step label */}
                            <div className="text-center">
                                <p className="font-semibold text-foreground text-lg">{currentStepInfo.label}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{currentStepInfo.sub}</p>
                            </div>

                            {/* Step dots */}
                            <div className="flex gap-2 mt-1">
                                {(["reading", "analyzing", "building"] as const).map((s) => (
                                    <motion.div
                                        key={s}
                                        className={`h-2 rounded-full transition-all duration-500 ${step === s
                                                ? "w-6 bg-primary"
                                                : (["reading", "analyzing", "building"].indexOf(step) > ["reading", "analyzing", "building"].indexOf(s)
                                                    ? "w-2 bg-primary/60"
                                                    : "w-2 bg-muted-foreground/30")
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── ERROR state ── */}
                {step === "error" && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-2xl border border-destructive/50 bg-destructive/5 p-6"
                    >
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-destructive text-sm">Import Failed</p>
                                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={reset}
                            className="mt-4 w-full"
                        >
                            Try Again
                        </Button>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
