
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Search, Target, Zap, Layout, Type } from 'lucide-react';

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
    } | null;
    loading: boolean;
}

export function ATSResults({ data, loading }: ATSResultsProps) {
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
                                strokeDashoffset={2 * Math.PI * 45 * ((100 - premiumData.score) / 100)}
                                strokeLinecap="round"
                                className={`transition-all duration-1000 ease-out ${getScoreColor(premiumData.score)}`}
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className={`text-3xl font-bold ${getScoreColor(premiumData.score)}`}>{premiumData.score}</span>
                            <span className="text-xs uppercase font-bold text-muted-foreground">Score</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 flex-1">
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Impact</span>
                                <span>{premiumData.category_scores.impact}/100</span>
                            </div>
                            <Progress value={premiumData.category_scores.impact} className="h-2" indicatorClassName={getScoreBg(premiumData.category_scores.impact)} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="flex items-center gap-1.5"><Layout className="w-3 h-3" /> Structure</span>
                                <span>{premiumData.category_scores.structure}/100</span>
                            </div>
                            <Progress value={premiumData.category_scores.structure} className="h-2" indicatorClassName={getScoreBg(premiumData.category_scores.structure)} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="flex items-center gap-1.5"><Type className="w-3 h-3" /> Brevity</span>
                                <span>{premiumData.category_scores.brevity}/100</span>
                            </div>
                            <Progress value={premiumData.category_scores.brevity} className="h-2" indicatorClassName={getScoreBg(premiumData.category_scores.brevity)} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="flex items-center gap-1.5"><Target className="w-3 h-3" /> Style</span>
                                <span>{premiumData.category_scores.style}/100</span>
                            </div>
                            <Progress value={premiumData.category_scores.style} className="h-2" indicatorClassName={getScoreBg(premiumData.category_scores.style)} />
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                <Tabs defaultValue="feedback" className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-background px-4 h-12">
                        <TabsTrigger value="feedback" className="data-[state=active]:bg-primary/5">Feedback</TabsTrigger>
                        <TabsTrigger value="keywords" className="data-[state=active]:bg-primary/5">
                            Keywords
                            {premiumData.keywords.missing.length > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">{premiumData.keywords.missing.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="issues" className="data-[state=active]:bg-primary/5">
                            Fixes Needed
                            {premiumData.red_flags.length > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">{premiumData.red_flags.length}</Badge>}
                        </TabsTrigger>
                    </TabsList>

                    <div className="p-6">
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
                                <div>
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <XCircle className="h-4 w-4 text-red-500" />
                                        Missing Keywords
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {premiumData.keywords.missing.length > 0 ? (
                                            premiumData.keywords.missing.map((k, i) => (
                                                <Badge key={i} variant="outline" className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100">
                                                    {k}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">No critical keywords missing.</p>
                                        )}
                                    </div>
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
