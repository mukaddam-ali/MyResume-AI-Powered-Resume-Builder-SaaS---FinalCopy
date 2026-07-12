"use client";

import React, { useMemo } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { Lock, Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { ATSResults } from './ATSResults';
import UpgradeButton from '@/components/payment/UpgradeButton';

// Simple hash function for caching
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

export function ResumeScore() {
    const { resumes, activeResumeId, getAnalysisCache, setAnalysisCache, setAnalysisResult } = useResumeStore();
    const { isPremium } = useAuth();
    const activeResume = activeResumeId ? resumes[activeResumeId] : null;
    const [loading, setLoading] = React.useState(false);
    const [isExpanded, setIsExpanded] = React.useState(true);
    const [jobDescription, setJobDescription] = React.useState('');
    const [showJdInput, setShowJdInput] = React.useState(false);

    // Get analysis data directly from the active resume in the store
    // This ensures persistence across edits and reloads
    const analysisData = activeResume?.analysisResult || null;

    // Initial "Quick Scan" Score (Local Heuristics) - visible to all users
    const quickScore = useMemo(() => {
        if (!activeResume) return 0;
        let score = 0;
        const { personalInfo, experience, education, skills, sectionOrder } = activeResume;

        // Helper to check if section is visible
        const isVisible = (id: string) => sectionOrder?.includes(id);

        // Stricter checks with trim() AND visibility
        if (personalInfo?.fullName?.trim()) score += 10;
        if (personalInfo?.email?.trim()) score += 10;
        if (isVisible('experience') && experience && experience.length > 0) score += 30;
        if (isVisible('education') && education && education.length > 0) score += 20;
        if (isVisible('skills') && skills && Array.isArray(skills) && skills.length > 0) score += 20;
        if (personalInfo?.summary?.trim()) score += 10;

        return Math.min(score, 100);
    }, [
        activeResume?.personalInfo?.fullName,
        activeResume?.personalInfo?.email,
        activeResume?.personalInfo?.summary,
        activeResume?.experience?.length,
        activeResume?.education?.length,
        activeResume?.skills?.length,
        activeResume?.skills,
        activeResume?.sectionOrder
    ]);



    // Generate free tier analysis (percentages only, no AI)
    const generateFreeAnalysis = () => {
        if (!activeResume) return null;

        const { personalInfo, experience, education, skills, sectionOrder } = activeResume;
        const isVisible = (id: string) => sectionOrder?.includes(id);

        const allSections = [
            {
                label: 'Personal Information',
                score: Math.round(
                    ((personalInfo?.fullName?.trim() ? 100 : 0) +
                        (personalInfo?.email?.trim() ? 100 : 0) +
                        (personalInfo?.summary?.trim() ? 100 : 0)) / 3
                ),
                completed: !!(personalInfo?.fullName?.trim() && personalInfo?.email?.trim())
            },
            {
                label: 'Work Experience',
                score: isVisible('experience') && experience && experience.length > 0 ? 100 : 0,
                completed: isVisible('experience') && experience && experience.length > 0
            },
            {
                label: 'Education',
                score: isVisible('education') && education && education.length > 0 ? 100 : 0,
                completed: isVisible('education') && education && education.length > 0
            },
            {
                label: 'Skills',
                score: isVisible('skills') && skills && Array.isArray(skills) && skills.length > 0 ? 100 : 0,
                completed: isVisible('skills') && !!(skills && Array.isArray(skills) && skills.length > 0)
            }
        ];

        return {
            isFreeAnalysis: true as const,
            overallScore: quickScore,
            sections: allSections // Return all sections, even if score is 0
        };
    };

    const [error, setError] = React.useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!activeResume) return;

        setLoading(true);
        setError(null);
        setIsExpanded(true);

        try {
            // Deterministic scan — cache key includes JD since it changes the result
            const jd = isPremium ? jobDescription.trim() : '';
            const cacheKey = simpleHash(JSON.stringify(activeResume) + jd + (isPremium ? 'pro' : 'free'));
            const cachedResult = getAnalysisCache(cacheKey);
            if (cachedResult) {
                setAnalysisResult(cachedResult);
                setLoading(false);
                return;
            }

            // Prepare filtered data (only visible sections)
            const visibleSections = activeResume.sectionOrder || [];
            const filteredResume = {
                ...activeResume,
                experience: visibleSections.includes('experience') ? activeResume.experience : [],
                education: visibleSections.includes('education') ? activeResume.education : [],
                projects: visibleSections.includes('projects') ? activeResume.projects : [],
                skills: visibleSections.includes('skills') ? activeResume.skills : [],
                customSections: (activeResume.customSections || []).filter(s => visibleSections.includes(s.id))
            };

            // The real ATS scan: renders the actual PDF server-side and re-parses
            // it. Runs for free AND pro users (it's deterministic, no AI cost).
            const scanPromise = fetch('/api/ats/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resumeData: filteredResume,
                    jobDescription: jd || undefined,
                }),
            }).then(r => r.json());

            // Pro: AI rewrite suggestions in parallel (advice only — the score
            // comes from the deterministic scan)
            const aiPromise = isPremium
                ? fetch('/api/ai/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resumeData: filteredResume,
                        jobDescription: jd || undefined,
                    }),
                }).then(r => r.json()).catch(() => null)
                : Promise.resolve(null);

            const [scan, ai] = await Promise.all([scanPromise, aiPromise]);

            if (scan.error) {
                throw new Error(scan.error);
            }

            // Merge: deterministic scores + parse test are authoritative; AI
            // contributes qualitative rewrite suggestions when available.
            const merged = {
                ...scan,
                suggested_edits: ai && !ai.error && Array.isArray(ai.suggested_edits) ? ai.suggested_edits : [],
            };

            setAnalysisCache(cacheKey, merged);
            setAnalysisResult(merged);
        } catch (error: any) {
            console.error("ATS Scan Error:", error);
            setError(error.message?.includes('Too many')
                ? "Too many scans — wait a moment and try again."
                : "Scan service unavailable. Showing basic completeness check instead.");

            // Offline fallback: local completeness check
            const freeAnalysis = generateFreeAnalysis();
            if (freeAnalysis) {
                setAnalysisResult(freeAnalysis);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 mb-4">
            <Card className="bg-background/50 backdrop-blur-sm border-2">
                <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span>ATS Scanner</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {isPremium
                            ? "We render your real PDF, re-parse it like an ATS does, match it against the job description, and add AI suggestions."
                            : "We render your real PDF and re-parse it exactly like an ATS does — a measured score, not a guess."}
                    </p>

                    {/* Job description tailoring (premium) */}
                    {isPremium && (
                        <div className="space-y-2">
                            <button
                                onClick={() => setShowJdInput(!showJdInput)}
                                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                                aria-expanded={showJdInput}
                            >
                                {showJdInput ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                {jobDescription.trim() ? "Tailoring to a job description ✓" : "Tailor to a specific job (paste description)"}
                            </button>
                            {showJdInput && (
                                <textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value.slice(0, 5000))}
                                    placeholder="Paste the job description here — the analysis will score keyword match and relevance against this specific role."
                                    rows={5}
                                    className="w-full text-sm p-3 rounded-md border bg-background resize-y focus:outline-none focus:ring-2 focus:ring-primary/40"
                                    aria-label="Job description to tailor the analysis to"
                                />
                            )}
                        </div>
                    )}

                    {/* Universal ATS Analysis Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="w-full py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {loading ? "Analyzing..." : "Run ATS Scan"}
                    </button>

                    {/* Premium feature upsell for free users */}
                    {!isPremium && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded border">
                                <Lock className="h-3 w-3 text-purple-600" />
                                <span>Detailed AI feedback is available in <strong>Premium</strong></span>
                            </div>
                            <UpgradeButton size="sm" fullWidth />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-md border border-red-200 dark:border-red-800">
                    <p className="font-medium flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        {error}
                    </p>
                </div>
            )}

            {/* Results display */}
            {(analysisData || loading) && (
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-sm font-medium text-muted-foreground">Analysis Results</span>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 hover:bg-muted rounded-full transition-colors"
                            title={isExpanded ? "Collapse Results" : "Expand Results"}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "Collapse scan results" : "Expand scan results"}
                        >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                    </div>

                    {isExpanded && (
                        <div className="transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-2">
                            <ATSResults data={analysisData} loading={loading} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
