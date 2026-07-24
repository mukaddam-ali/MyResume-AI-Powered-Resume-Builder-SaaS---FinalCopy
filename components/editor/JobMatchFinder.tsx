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
import { Briefcase, Loader2, ExternalLink, MapPin, Building2 } from "lucide-react";

interface MatchedJob {
    title: string;
    company: string;
    location: string;
    url: string;
    updatedAt: string;
    matchRate: number;
    found: string[];
    missing: string[];
}

function getScoreColor(rate: number): string {
    if (rate >= 70) return "text-green-600 dark:text-green-400";
    if (rate >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-500";
}

export function JobMatchFinder() {
    const { resumes, activeResumeId } = useResumeStore();
    const activeResume = activeResumeId ? resumes[activeResumeId] : null;

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [jobs, setJobs] = useState<MatchedJob[] | null>(null);
    const [totalScanned, setTotalScanned] = useState(0);

    if (!activeResume) return null;

    const handleOpen = async () => {
        setOpen(true);
        if (jobs) return; // already fetched this session
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/jobs/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeData: activeResume }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Search failed");
            setJobs(data.jobs);
            setTotalScanned(data.totalScanned || 0);
        } catch (e: any) {
            setError(e.message || "Couldn't search jobs right now. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setJobs(null);
        handleOpen();
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={handleOpen}
                className="gap-1.5 text-xs h-8 border-emerald-300 text-emerald-600 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                title="Find open roles that match this resume"
            >
                <Briefcase className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Find Matching Jobs</span>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[640px] max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-emerald-500" />
                            Matching Jobs
                        </DialogTitle>
                        <DialogDescription>
                            Open roles from a curated list of company job boards, ranked by how well "{activeResume.name}" matches each one.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                                <p className="text-sm text-muted-foreground">Scanning open roles...</p>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-sm text-red-700 dark:text-red-300">
                                {error}
                            </div>
                        )}

                        {!loading && !error && jobs && jobs.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Briefcase className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                <p>No scoreable matches found right now — try again later as boards refresh.</p>
                            </div>
                        )}

                        {!loading && !error && jobs && jobs.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs text-muted-foreground">
                                    Scanned {totalScanned} open roles — showing the top {jobs.length} matches.
                                </p>
                                {jobs.map((job, i) => (
                                    <a
                                        key={i}
                                        href={job.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block rounded-lg border bg-card hover:bg-muted/40 transition-colors p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{job.title}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {job.company}</span>
                                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className={`text-sm font-bold tabular-nums ${getScoreColor(job.matchRate)}`}>
                                                    {job.matchRate}%
                                                </span>
                                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                            </div>
                                        </div>
                                        {job.found.length > 0 && (
                                            <p className="text-xs text-muted-foreground mt-2 truncate">
                                                Matches: {job.found.slice(0, 6).join(", ")}{job.found.length > 6 ? "…" : ""}
                                            </p>
                                        )}
                                    </a>
                                ))}
                                <button
                                    onClick={handleRefresh}
                                    className="text-xs text-emerald-600 hover:underline pt-1"
                                >
                                    Refresh results
                                </button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
