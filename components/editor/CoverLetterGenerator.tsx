"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useResumeStore } from "@/store/useResumeStore";
import { useAuth } from "@/lib/auth-context";
import { FileText, Loader2, Copy, Check, Download, Sparkles, Lock, Info, AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import type { CoverLetterStageName } from "@/lib/ai/coverLetter/types";

type Tone = "professional" | "enthusiastic" | "concise";

const STAGE_ORDER: { key: CoverLetterStageName; label: string }[] = [
    { key: "analyze", label: "Analyzing the job description" },
    { key: "outline", label: "Planning your letter" },
    { key: "draft", label: "Writing your draft" },
    { key: "critique", label: "Polishing & fact-checking" },
];

export function CoverLetterGenerator() {
    const { resumes, activeResumeId } = useResumeStore();
    const { isPremium } = useAuth();
    const activeResume = activeResumeId ? resumes[activeResumeId] : null;

    const [open, setOpen] = useState(false);
    const [jobDescription, setJobDescription] = useState("");
    const [company, setCompany] = useState("");
    const [tone, setTone] = useState<Tone>("professional");
    const [letter, setLetter] = useState("");
    const [stage, setStage] = useState<CoverLetterStageName | null>(null);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    if (!activeResume) return null;

    const loading = stage !== null;

    // The AI writes the letter FROM the resume — warn when key sections are
    // empty so users know why their letter might come out generic.
    const missingParts: string[] = [];
    const info = activeResume.personalInfo;
    if (!info?.fullName?.trim() || info.fullName.trim() === "New User") missingParts.push("your name");
    if (!info?.summary?.trim()) missingParts.push("a summary");
    if (!activeResume.experience?.length) missingParts.push("work experience");
    if (!activeResume.skills?.length) missingParts.push("skills");

    const handleGenerate = async () => {
        setStage("analyze");
        setError(null);
        try {
            const res = await fetch("/api/ai/cover-letter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeData: activeResume, jobDescription, company, tone }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Generation failed (${res.status}).`);
            }
            if (!res.body) {
                throw new Error("Streaming isn't supported in this browser — try a different browser.");
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let finalLetter: string | null = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                // NDJSON: chunk boundaries never line up with line boundaries,
                // so buffer until we see a complete "\n"-terminated line.
                buffer += decoder.decode(value, { stream: true });
                let newlineIndex;
                while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
                    const line = buffer.slice(0, newlineIndex).trim();
                    buffer = buffer.slice(newlineIndex + 1);
                    if (!line) continue;
                    const event = JSON.parse(line);
                    if (event.type === "stage") setStage(event.stage);
                    else if (event.type === "result") finalLetter = event.coverLetter;
                    else if (event.type === "error") throw new Error(event.message);
                }
            }

            if (finalLetter == null) throw new Error("Generation ended unexpectedly. Please try again.");
            setLetter(finalLetter);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setStage(null);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(letter);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // clipboard unavailable — user can select manually
        }
    };

    const triggerDownload = (blob: Blob, extension: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(activeResume.personalInfo.fullName || "cover_letter").replace(/\s+/g, "_")}_Cover_Letter.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadTxt = () => {
        triggerDownload(new Blob([letter], { type: "text/plain;charset=utf-8" }), "txt");
    };

    // PDF with the header (name, title, contact details) auto-filled from the
    // resume. react-pdf is imported on demand — it's heavy and most users copy.
    const handleDownloadPdf = async () => {
        setDownloadingPdf(true);
        try {
            const [{ pdf }, { CoverLetterDocument }] = await Promise.all([
                import("@react-pdf/renderer"),
                import("./CoverLetterDocument"),
            ]);
            const blob = await pdf(
                <CoverLetterDocument resumeData={activeResume} letterText={letter} company={company} />
            ).toBlob();
            triggerDownload(blob, "pdf");
        } catch (e) {
            console.error("Cover letter PDF error:", e);
            alert("Could not generate the PDF. You can still copy the text or download it as .txt.");
        } finally {
            setDownloadingPdf(false);
        }
    };

    const activeStageIndex = stage ? STAGE_ORDER.findIndex((s) => s.key === stage) : -1;

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    if (!isPremium) {
                        alert("✉️ The AI Cover Letter Generator is a PRO feature. Upgrade to generate tailored cover letters from your resume!");
                        return;
                    }
                    setOpen(true);
                }}
                className="gap-1.5 text-xs h-8 border-indigo-300 text-indigo-600 dark:text-indigo-400 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                title={isPremium ? "Generate an AI cover letter from this resume" : "PRO: AI Cover Letter"}
            >
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cover Letter</span>
                {!isPremium && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 font-bold flex items-center gap-0.5">
                        <Lock className="h-2.5 w-2.5" /> PRO
                    </span>
                )}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-indigo-500" />
                            AI Cover Letter
                        </DialogTitle>
                        <DialogDescription>
                            Paste the job description and we'll write a cover letter tailored to it, using the achievements from "{activeResume.name}".
                        </DialogDescription>
                    </DialogHeader>

                    {!letter ? (
                        <div className="space-y-4">
                            {/* The letter is only as good as the resume it reads */}
                            {missingParts.length > 0 ? (
                                <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        <strong>Your resume is missing {missingParts.join(", ")}.</strong>{" "}
                                        The AI writes the cover letter from your resume's content — fill
                                        those in first for a much stronger, personalized letter.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        The AI reads your resume (summary, experience, skills, projects) and
                                        matches it to the job description — your real achievements, never invented ones.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium" htmlFor="cl-company">Company name <span className="text-muted-foreground font-normal">(optional)</span></label>
                                <input
                                    id="cl-company"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value.slice(0, 120))}
                                    placeholder="e.g. Acme Corp"
                                    disabled={loading}
                                    className="w-full text-sm p-2.5 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:opacity-60"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium" htmlFor="cl-jd">Job description</label>
                                <textarea
                                    id="cl-jd"
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value.slice(0, 5000))}
                                    placeholder="Paste the full job posting here…"
                                    rows={8}
                                    disabled={loading}
                                    className="w-full text-sm p-3 rounded-md border bg-background resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:opacity-60"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-sm font-medium">Tone</span>
                                <div className="flex gap-2">
                                    {(["professional", "enthusiastic", "concise"] as Tone[]).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTone(t)}
                                            disabled={loading}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize disabled:opacity-60 ${tone === t
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-background text-muted-foreground hover:bg-muted"}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {loading && (
                                <div className="space-y-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 rounded-lg p-3">
                                    {STAGE_ORDER.map((s, i) => {
                                        const isDone = i < activeStageIndex;
                                        const isActive = i === activeStageIndex;
                                        return (
                                            <div key={s.key} className="flex items-center gap-2 text-sm">
                                                {isDone ? (
                                                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                                ) : isActive ? (
                                                    <Loader2 className="h-4 w-4 text-indigo-600 animate-spin shrink-0" />
                                                ) : (
                                                    <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                                                )}
                                                <span className={isDone ? "text-muted-foreground" : isActive ? "text-indigo-700 dark:text-indigo-300 font-medium" : "text-muted-foreground/60"}>
                                                    {s.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {error && (
                                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md p-3">{error}</p>
                            )}

                            <Button
                                onClick={handleGenerate}
                                disabled={loading || jobDescription.trim().length < 30}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                size="lg"
                            >
                                {loading ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Working…</>
                                ) : (
                                    <><Sparkles className="h-4 w-4 mr-2" /> Generate Cover Letter</>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <textarea
                                value={letter}
                                onChange={(e) => setLetter(e.target.value)}
                                rows={16}
                                className="w-full text-sm p-4 rounded-md border bg-background leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                aria-label="Generated cover letter (editable)"
                            />
                            <p className="text-xs text-muted-foreground">
                                The PDF header (name, title, contact details) is filled automatically from your resume.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    onClick={handleDownloadPdf}
                                    disabled={downloadingPdf}
                                    size="sm"
                                    className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    {downloadingPdf ? "Preparing…" : "Download PDF"}
                                </Button>
                                <Button onClick={handleCopy} variant="outline" size="sm" className="gap-1.5">
                                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                    {copied ? "Copied!" : "Copy"}
                                </Button>
                                <Button onClick={handleDownloadTxt} variant="outline" size="sm" className="gap-1.5">
                                    <Download className="h-4 w-4" /> .txt
                                </Button>
                                <Button onClick={() => setLetter("")} variant="ghost" size="sm" className="ml-auto">
                                    ← Start over
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
