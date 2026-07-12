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
import { FileText, Loader2, Copy, Check, Download, Sparkles, Lock } from "lucide-react";

type Tone = "professional" | "enthusiastic" | "concise";

export function CoverLetterGenerator() {
    const { resumes, activeResumeId } = useResumeStore();
    const { isPremium } = useAuth();
    const activeResume = activeResumeId ? resumes[activeResumeId] : null;

    const [open, setOpen] = useState(false);
    const [jobDescription, setJobDescription] = useState("");
    const [company, setCompany] = useState("");
    const [tone, setTone] = useState<Tone>("professional");
    const [letter, setLetter] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    if (!activeResume) return null;

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/ai/cover-letter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeData: activeResume, jobDescription, company, tone }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Generation failed.");
            setLetter(data.coverLetter);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
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

    const handleDownload = () => {
        const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(activeResume.personalInfo.fullName || "cover_letter").replace(/\s+/g, "_")}_Cover_Letter.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

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
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium" htmlFor="cl-company">Company name <span className="text-muted-foreground font-normal">(optional)</span></label>
                                <input
                                    id="cl-company"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value.slice(0, 120))}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full text-sm p-2.5 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
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
                                    className="w-full text-sm p-3 rounded-md border bg-background resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-sm font-medium">Tone</span>
                                <div className="flex gap-2">
                                    {(["professional", "enthusiastic", "concise"] as Tone[]).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTone(t)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${tone === t
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-background text-muted-foreground hover:bg-muted"}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

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
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Writing your letter…</>
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
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={handleCopy} variant="outline" size="sm" className="gap-1.5">
                                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                    {copied ? "Copied!" : "Copy"}
                                </Button>
                                <Button onClick={handleDownload} variant="outline" size="sm" className="gap-1.5">
                                    <Download className="h-4 w-4" /> Download .txt
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
