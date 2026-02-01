"use client";

import React, { useMemo } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { Lock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { ATSResults } from './ATSResults';

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

    const handleAnalyze = async () => {
        if (!activeResume) return;

        // NOTE: We do NOT clear the previous result here (setAnalysisResult(null))
        // This ensures the old result stays visible while the new one loads if we wanted (or just until complete)
        // Currently we show a loading spinner which replaces content, but persistence is key for edits.
        setLoading(true);
        setIsExpanded(true);

        if (isPremium) {
            // Premium: AI-powered analysis
            try {
                // Generate hash for caching
                const cacheKey = simpleHash(JSON.stringify(activeResume));

                // Check cache first
                const cachedResult = getAnalysisCache(cacheKey);
                if (cachedResult) {
                    setAnalysisResult(cachedResult);
                    setLoading(false);
                    return;
                }

                const response = await fetch('/api/ai/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resumeData: activeResume
                    })
                });
                const data = await response.json();
                if (data.error) throw new Error(data.error);

                // Cache the result
                setAnalysisCache(cacheKey, data);
                setAnalysisResult(data);
            } catch (error) {
                console.error("ATS Scan Error:", error);
                // Fallback to free analysis on error (e.g., quota exceeded)
                const freeAnalysis = generateFreeAnalysis();
                if (freeAnalysis) {
                    setAnalysisResult(freeAnalysis);
                    alert("AI Service Unavailable. Showing Basic Scan instead.");
                }
            } finally {
                setLoading(false);
            }
        } else {
            // Free: Basic percentage analysis (no AI)
            setTimeout(() => {
                const freeAnalysis = generateFreeAnalysis();
                setAnalysisResult(freeAnalysis);
                setLoading(false);
                setIsExpanded(true);
            }, 800); // Simulate brief processing
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
                            ? "Run a deep AI analysis to check your resume against ATS filters and job descriptions."
                            : "Scan your resume to check completeness and section scores."}
                    </p>



                    {/* Universal ATS Analysis Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={true} // Temporarily disabled for all users
                        className="w-full py-2.5 bg-primary/50 text-primary-foreground rounded-md font-medium text-sm transition-all shadow-md cursor-not-allowed flex items-center justify-center gap-2 opacity-70"
                    >
                        <Sparkles className="h-4 w-4" />
                        Coming Soon
                    </button>

                    {/* Premium feature upsell for free users */}
                    {!isPremium && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded border">
                            <Lock className="h-3 w-3 text-purple-600" />
                            <span>Detailed AI feedback is available in <strong>Premium</strong></span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Results display */}
            {(analysisData || loading) && (
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-sm font-medium text-muted-foreground">Analysis Results</span>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 hover:bg-muted rounded-full transition-colors"
                            title={isExpanded ? "Collapse Results" : "Expand Results"}
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
