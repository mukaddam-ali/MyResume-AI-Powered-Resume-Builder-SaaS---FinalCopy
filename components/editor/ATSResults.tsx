
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Search, Target, Zap, Layout, Type, Sparkles, Plus, Wand2, CheckCheck } from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { wrapBulletReplacement } from '@/lib/ats/metrics';

interface ATSResultsProps {
    data: {
        // Free tier analysis
        isFreeAnalysis?: boolean;
        overallScore?: number;
        sections?: Array<{
            label: string;
            score: number;
            completed: boolean;
        }>;
        // Premium tier analysis
        score?: number;
        category_scores?: {
            impact: number;
            brevity: number;
            style: number;
            structure: number;
        };
        keywords?: {
            found: string[];
            missing: string[];
        };
        feedback?: string[];
        red_flags?: string[];
        summary?: string;
        suggested_edits?: Array<{
            location: string;
            original: string;
            suggestion: string;
            reason: string;
            entryType?: 'experience' | 'project' | 'custom';
            entryId?: string;
            customSectionId?: string;
            raw?: string;
        }>;
        // Deterministic — the exact bullets dragging the score down, with
        // their location (which entry, which line) and why they're flagged.
        weak_bullets?: Array<{
            section: string;
            entryLabel: string;
            entryType: 'experience' | 'project' | 'custom';
            entryId: string;
            customSectionId?: string;
            index: number;
            text: string;
            raw: string;
            issues: string[];
        }>;
        // AI holistic quality read — a second opinion alongside the
        // deterministic score, judging real substance rather than literal
        // metrics/keyword rules. null when the AI call failed or was skipped.
        ai_score?: number | null;
        ai_category_scores?: {
            impact: number;
            brevity: number;
            style: number;
            structure: number;
        } | null;
        ai_summary?: string | null;
        // Deterministic scan extras
        deterministic?: boolean;
        parse_score?: number;
        match_rate?: number | null;
        jd_skill_count?: number | null;
        parse?: {
            ok: boolean;
            extractionRate: number;
            emailFound: boolean;
            phoneFound: boolean;
            linkedinFound: boolean;
            headingsFound: string[];
            headingsMissing: string[];
            headingOrder: string[];
            twoColumnLayout: boolean;
            pageCount: number;
            extractedText: string;
        };
        metrics?: {
            bulletCount: number;
            quantifiedPct: number;
            actionVerbPct: number;
            avgBulletWords: number;
            totalWords: number;
        };
    } | null;
    loading: boolean;
}

function CheckRow({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
    return (
        <div className="flex items-start gap-2 text-sm">
            {ok ? (
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            ) : (
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            )}
            <span>
                {label}
                {detail && <span className="text-muted-foreground"> — {detail}</span>}
            </span>
        </div>
    );
}

export function ATSResults({ data, loading }: ATSResultsProps) {
    const { resumes, activeResumeId, setSkills } = useResumeStore();
    const activeResume = activeResumeId ? resumes[activeResumeId] : null;
    const [appliedEdits, setAppliedEdits] = React.useState<Set<number>>(new Set());

    // One-click JD tailoring: move a missing keyword straight into Skills
    const addKeywordToSkills = (keyword: string) => {
        if (!activeResume) return;
        const current = Array.isArray(activeResume.skills) ? activeResume.skills : [];
        if (current.some(s => s.toLowerCase() === keyword.toLowerCase())) return;
        setSkills([...current, keyword]);
    };

    // Splice an AI-rewritten bullet directly into the resume data. Reads the
    // freshest store state on every call (rather than the render-time
    // `activeResume` closure) so "Apply All" can safely apply several
    // rewrites into the same entry back-to-back without one clobbering another.
    const applyRewrite = (edit: { entryType?: string; entryId?: string; customSectionId?: string; raw?: string; suggestion: string }): boolean => {
        if (!edit.entryType || !edit.entryId || !edit.raw) return false;
        const state = useResumeStore.getState();
        const resumeId = state.activeResumeId;
        if (!resumeId) return false;
        const resume = state.resumes[resumeId];
        if (!resume) return false;
        const newRaw = wrapBulletReplacement(edit.raw, edit.suggestion);

        if (edit.entryType === 'experience') {
            const exp = resume.experience?.find(e => e.id === edit.entryId);
            if (!exp || !exp.description.includes(edit.raw)) return false;
            state.updateExperience(edit.entryId, { description: exp.description.replace(edit.raw, newRaw) });
            return true;
        }
        if (edit.entryType === 'project') {
            const proj = resume.projects?.find(p => p.id === edit.entryId);
            if (!proj || !proj.description.includes(edit.raw)) return false;
            state.updateProject(edit.entryId, { description: proj.description.replace(edit.raw, newRaw) });
            return true;
        }
        if (edit.entryType === 'custom' && edit.customSectionId) {
            const cs = resume.customSections?.find(s => s.id === edit.customSectionId);
            const item = cs?.items.find(it => it.id === edit.entryId);
            if (!item || !item.description.includes(edit.raw)) return false;
            state.updateCustomItem(edit.customSectionId, edit.entryId, { description: item.description.replace(edit.raw, newRaw) });
            return true;
        }
        return false;
    };

    if (loading) {
        return (
            <Card className="mt-6 border-2 border-primary/20">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-4 border-muted/30"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                            <Search className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground animate-pulse">Running AI Analysis...</p>
                        <p className="text-xs text-muted-foreground">Checking ATS compatibility & generating suggestions...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    // Free tier analysis - simple percentage display
    if (data.isFreeAnalysis) {
        return (
            <Card className="mt-6 border-2">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            ATS Scan Results
                        </span>
                        <div className="text-2xl font-bold text-primary">{data.overallScore}%</div>
                    </CardTitle>
                    <CardDescription>Basic score breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                        {data.sections?.map((section, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border">
                                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                                    {section.completed ? (
                                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                    )}
                                    <span className="font-medium truncate">{section.label}</span>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <Progress value={section.score} className="w-24 h-2" />
                                    <span className={`text-sm font-bold tabular-nums w-12 text-right ${section.score >= 80 ? 'text-green-600' : section.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                        {section.score}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Premium tier analysis - full AI-powered feedback
    const premiumData = data as Required<typeof data>;

    const applicableEditIndices = (premiumData.suggested_edits || [])
        .map((e, i) => (e.entryId && e.entryType && e.raw ? i : -1))
        .filter(i => i >= 0);

    const handleApply = (index: number) => {
        const edit = premiumData.suggested_edits?.[index];
        if (!edit) return;
        if (applyRewrite(edit)) setAppliedEdits(prev => new Set(prev).add(index));
    };

    const handleApplyAll = () => {
        const newlyApplied = new Set(appliedEdits);
        (premiumData.suggested_edits || []).forEach((edit, i) => {
            if (!newlyApplied.has(i) && applyRewrite(edit)) newlyApplied.add(i);
        });
        setAppliedEdits(newlyApplied);
    };

    // Ensure score is 0-100 (handle 0-1 decimals just in case)
    const displayScore = premiumData.score <= 1 && premiumData.score > 0
        ? Math.round(premiumData.score * 100)
        : Math.round(premiumData.score);

    // Normalize category scores if they are likely 1-10 scale
    const normalizeCategoryScore = (score: number) => {
        return score <= 10 && score > 0 ? score * 10 : score;
    };

    const categoryScores = {
        impact: normalizeCategoryScore(premiumData.category_scores.impact),
        brevity: normalizeCategoryScore(premiumData.category_scores.brevity),
        style: normalizeCategoryScore(premiumData.category_scores.style),
        structure: normalizeCategoryScore(premiumData.category_scores.structure),
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <Card className="mt-6 border-none shadow-xl bg-gradient-to-b from-background to-muted/20 overflow-hidden ring-1 ring-border/50">
            <CardHeader className="bg-muted/30 pb-6 border-b">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Target className="h-5 w-5 text-primary" />
                            ATS Analysis Report
                        </CardTitle>
                        <CardDescription className="mt-1">
                            {premiumData.summary}
                        </CardDescription>
                    </div>
                </div>

                {typeof premiumData.ai_score === 'number' && (
                    <div className="mt-4 flex items-start gap-2.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 rounded-lg p-3">
                        <Sparkles className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-sm">
                                <span className={`font-bold ${getScoreColor(premiumData.ai_score)}`}>AI Quality Score: {premiumData.ai_score}/100</span>
                                <span className="text-muted-foreground"> — a holistic read of your resume's real substance, separate from the deterministic ATS score above.</span>
                            </p>
                            {premiumData.ai_summary && (
                                <p className="text-xs text-muted-foreground mt-1">{premiumData.ai_summary}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Score Dashboard */}
                <div className="flex items-center gap-8 mt-6">
                    <div className="relative flex items-center justify-center w-32 h-32 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeDasharray={2 * Math.PI * 45}
                                strokeDashoffset={2 * Math.PI * 45 * ((100 - displayScore) / 100)}
                                strokeLinecap="round"
                                className={`transition-all duration-1000 ease-out ${getScoreColor(displayScore)}`}
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className={`text-3xl font-bold ${getScoreColor(displayScore)}`}>{displayScore}</span>
                            <span className="text-xs uppercase font-bold text-muted-foreground">ATS Score</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 flex-1">
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Impact</span>
                                <span>{categoryScores.impact}/100</span>
                            </div>
                            <Progress value={categoryScores.impact} className="h-2" indicatorClassName={getScoreBg(categoryScores.impact)} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="flex items-center gap-1.5"><Layout className="w-3 h-3" /> Structure</span>
                                <span>{categoryScores.structure}/100</span>
                            </div>
                            <Progress value={categoryScores.structure} className="h-2" indicatorClassName={getScoreBg(categoryScores.structure)} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="flex items-center gap-1.5"><Type className="w-3 h-3" /> Brevity</span>
                                <span>{categoryScores.brevity}/100</span>
                            </div>
                            <Progress value={categoryScores.brevity} className="h-2" indicatorClassName={getScoreBg(categoryScores.brevity)} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="flex items-center gap-1.5"><Target className="w-3 h-3" /> Style</span>
                                <span>{categoryScores.style}/100</span>
                            </div>
                            <Progress value={categoryScores.style} className="h-2" indicatorClassName={getScoreBg(categoryScores.style)} />
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                <Tabs defaultValue="suggestions" className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-background px-4 h-12">
                        <TabsTrigger value="suggestions" className="data-[state=active]:bg-primary/5">
                            Suggestions
                            {(() => {
                                const count = (premiumData.weak_bullets?.length || 0) || (premiumData.suggested_edits?.length || 0);
                                return count > 0 ? <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] bg-primary/10 text-primary">{count}</Badge> : null;
                            })()}
                        </TabsTrigger>
                        <TabsTrigger value="feedback" className="data-[state=active]:bg-primary/5">Feedback</TabsTrigger>
                        <TabsTrigger value="keywords" className="data-[state=active]:bg-primary/5">
                            Keywords
                            {premiumData.keywords.missing.length > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">{premiumData.keywords.missing.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="issues" className="data-[state=active]:bg-primary/5">
                            Fixes Needed
                            {premiumData.red_flags.length > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">{premiumData.red_flags.length}</Badge>}
                        </TabsTrigger>
                        {premiumData.parse && (
                            <TabsTrigger value="atsview" className="data-[state=active]:bg-primary/5">
                                ATS View
                                <Badge variant="secondary" className={`ml-2 h-5 px-1.5 text-[10px] ${premiumData.parse.extractionRate >= 90 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {premiumData.parse.extractionRate}%
                                </Badge>
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <div className="p-6">
                        <TabsContent value="suggestions" className="mt-0 space-y-6">
                            {premiumData.suggested_edits && premiumData.suggested_edits.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Rewrites</p>
                                        {applicableEditIndices.length > 1 && applicableEditIndices.some(i => !appliedEdits.has(i)) && (
                                            <button
                                                onClick={handleApplyAll}
                                                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                                            >
                                                <CheckCheck className="h-3.5 w-3.5" /> Apply All
                                            </button>
                                        )}
                                    </div>
                                    {premiumData.suggested_edits.map((edit, i) => {
                                        const canApply = !!(edit.entryId && edit.entryType && edit.raw);
                                        const applied = appliedEdits.has(i);
                                        return (
                                            <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                                                <div className="p-4 space-y-3">
                                                    <div className="flex items-center justify-between gap-2">
                                                        {edit.location ? (
                                                            <Badge variant="outline">{edit.location}</Badge>
                                                        ) : <span />}
                                                        {canApply && (
                                                            <button
                                                                onClick={() => handleApply(i)}
                                                                disabled={applied}
                                                                className={`flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1 transition-colors ${applied
                                                                    ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 cursor-default'
                                                                    : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                                                            >
                                                                {applied ? <CheckCircle className="h-3.5 w-3.5" /> : <Wand2 className="h-3.5 w-3.5" />}
                                                                {applied ? 'Applied' : 'Apply'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    {edit.original && (
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Currently</p>
                                                            <p className="text-sm text-muted-foreground line-through decoration-red-400/60">"{edit.original}"</p>
                                                        </div>
                                                    )}
                                                    <div className="space-y-1 bg-muted/40 p-3 rounded-md border border-dashed">
                                                        <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                                                            <Sparkles className="h-3 w-3" /> Change To
                                                        </p>
                                                        <p className="text-sm text-foreground/90 leading-relaxed">"{edit.suggestion}"</p>
                                                    </div>
                                                    {edit.reason && (
                                                        <p className="text-xs text-muted-foreground">{edit.reason}</p>
                                                    )}
                                                    {applied && (
                                                        <p className="text-xs text-muted-foreground italic">Applied — navigate to this section in the editor if you'd like to tweak the wording further.</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {premiumData.weak_bullets && premiumData.weak_bullets.length > 0 ? (
                                <div className="space-y-4">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Exactly Where To Fix{premiumData.suggested_edits && premiumData.suggested_edits.length > 0 ? ' (full list)' : ''}
                                    </p>
                                    {premiumData.weak_bullets.map((b, i) => (
                                        <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                                            <div className="p-4 space-y-2">
                                                <Badge variant="outline">{b.section} → {b.entryLabel} → bullet {b.index}</Badge>
                                                <p className="text-sm text-foreground/90 leading-relaxed">"{b.text}"</p>
                                                <ul className="space-y-1 pt-1">
                                                    {b.issues.map((issue, j) => (
                                                        <li key={j} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-500">
                                                            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                                                            <span>{issue}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (!premiumData.suggested_edits || premiumData.suggested_edits.length === 0) && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                    <p>No weak bullets found — your content already passes the deterministic checks!</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="feedback" className="mt-0 space-y-4">
                            <div className="space-y-3">
                                {premiumData.feedback.map((item, i) => (
                                    <div key={i} className="flex gap-3 text-sm">
                                        <div className="mt-0.5"><CheckCircle className="h-4 w-4 text-green-500" /></div>
                                        <p className="text-muted-foreground">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="keywords" className="mt-0">
                            <div className="space-y-6">
                                {typeof premiumData.match_rate === 'number' && (
                                    <div className="flex items-center justify-between bg-muted/40 border rounded-lg p-3">
                                        <span className="text-sm font-medium">Job description match</span>
                                        <span className={`text-lg font-bold ${premiumData.match_rate >= 70 ? 'text-green-600' : premiumData.match_rate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {premiumData.match_rate}%
                                            <span className="text-xs font-normal text-muted-foreground ml-1.5">
                                                of {premiumData.jd_skill_count} skills the job asks for
                                            </span>
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <XCircle className="h-4 w-4 text-red-500" />
                                        Missing Keywords
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {premiumData.keywords.missing.length > 0 ? (
                                            premiumData.keywords.missing.map((k, i) => {
                                                const alreadyAdded = activeResume?.skills?.some(
                                                    s => s.toLowerCase() === k.toLowerCase()
                                                );
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => addKeywordToSkills(k)}
                                                        disabled={alreadyAdded}
                                                        title={alreadyAdded ? 'Already in your skills' : `Add "${k}" to your Skills section`}
                                                        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                                                    >
                                                        <Badge
                                                            variant="outline"
                                                            className={alreadyAdded
                                                                ? 'border-green-200 bg-green-50 text-green-700'
                                                                : 'border-red-200 bg-red-50 text-red-700 hover:bg-green-50 hover:text-green-700 hover:border-green-300 cursor-pointer transition-colors gap-1'}
                                                        >
                                                            {k}
                                                            {alreadyAdded ? <CheckCircle className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                                        </Badge>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">No critical keywords missing.</p>
                                        )}
                                    </div>
                                    {premiumData.keywords.missing.length > 0 && (
                                        <p className="text-xs text-muted-foreground mt-2">Tip: click a keyword to add it to your Skills section.</p>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Found Keywords
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {premiumData.keywords.found.length > 0 ? (
                                            premiumData.keywords.found.map((k, i) => (
                                                <Badge key={i} variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                                                    {k}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">No specific keywords matched yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {premiumData.parse && (
                            <TabsContent value="atsview" className="mt-0 space-y-5">
                                <p className="text-sm text-muted-foreground">
                                    We rendered your actual PDF and re-parsed it with a real text extractor —
                                    the same operation an ATS performs when you upload your resume.
                                </p>

                                <div className="grid sm:grid-cols-2 gap-2">
                                    <CheckRow
                                        ok={premiumData.parse.extractionRate >= 85}
                                        label={`${premiumData.parse.extractionRate}% of content extracted`}
                                        detail={premiumData.parse.extractionRate >= 85 ? 'excellent' : 'some content may be lost'}
                                    />
                                    <CheckRow ok={premiumData.parse.emailFound} label="Email detected in parsed text" />
                                    <CheckRow ok={premiumData.parse.phoneFound} label="Phone number detected" />
                                    <CheckRow ok={premiumData.parse.linkedinFound} label="LinkedIn detected" />
                                    <CheckRow
                                        ok={premiumData.parse.headingsMissing.length === 0}
                                        label="Section headings parseable"
                                        detail={premiumData.parse.headingsMissing.length > 0 ? `missing: ${premiumData.parse.headingsMissing.join(', ')}` : undefined}
                                    />
                                    <CheckRow
                                        ok={premiumData.parse.pageCount <= 2}
                                        label={`${premiumData.parse.pageCount} page${premiumData.parse.pageCount === 1 ? '' : 's'}`}
                                    />
                                </div>

                                {premiumData.parse.headingOrder.length > 0 && (
                                    <div className="text-sm">
                                        <span className="font-semibold">Reading order</span>
                                        <span className="text-muted-foreground"> (how a parser encounters your sections{premiumData.parse.twoColumnLayout ? ' — two-column layout' : ''}): </span>
                                        <span className="text-muted-foreground">{premiumData.parse.headingOrder.join(' → ')}</span>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-sm font-semibold mb-2">What the ATS sees</h4>
                                    <pre className="text-[10px] leading-relaxed bg-muted/40 border rounded-lg p-3 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-muted-foreground">
                                        {premiumData.parse.extractedText || '(no text could be extracted)'}
                                    </pre>
                                </div>
                            </TabsContent>
                        )}

                        <TabsContent value="issues" className="mt-0">
                            <div className="space-y-3">
                                {premiumData.red_flags.length > 0 ? (
                                    premiumData.red_flags.map((flag, i) => (
                                        <div key={i} className="flex gap-3 text-sm bg-red-50/50 p-3 rounded-lg border border-red-100 dark:bg-red-900/10 dark:border-red-900/20">
                                            <div className="mt-0.5"><AlertTriangle className="h-4 w-4 text-red-500" /></div>
                                            <p className="text-red-700 dark:text-red-400 font-medium">{flag}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                                        <h4 className="font-semibold">No Critical Issues Found</h4>
                                        <p className="text-sm text-muted-foreground">Your resume has passed the basic red flag check.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
}
