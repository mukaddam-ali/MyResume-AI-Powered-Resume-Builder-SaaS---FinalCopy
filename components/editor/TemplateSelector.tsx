"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useResumeStore } from "@/store/useResumeStore";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Layout, FileText, PenTool, Palette, Sparkles, Crown, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import UpgradeButton from "@/components/payment/UpgradeButton";

// Dynamically import LiveResume preview to avoid SSR hydration issues
const LiveResume = dynamic(() => import("@/components/preview/LiveResume"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-zinc-900 rounded border">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
    ),
});

// Realistic lorem/example resume data for layout previews
const LOREM_RESUME_DATA = {
    id: "lorem-resume-preview",
    name: "Lorem Preview",
    lastModified: Date.now(),
    personalInfo: {
        fullName: "Alex Morgan",
        jobTitle: "Senior Software Engineer",
        email: "alex.morgan@example.com",
        phone: "(512) 555-0199",
        location: "Austin, TX",
        linkedin: "linkedin.com/in/alexdev",
        website: "alexdev.io",
        github: "github.com/alexdev",
        summary: "Full-stack developer with 5+ years of experience building scalable web applications. Reduced system latency by 60% across production apps serving 100K+ users. Specialized in React, Node.js, and AWS.",
    },
    education: [{
        id: "edu-1", school: "University of Texas at Austin", degree: "B.S. Computer Science", startDate: "Aug 2019", endDate: "May 2023", current: false
    }],
    experience: [
        {
            id: "exp-1",
            company: "TechGiant Corp",
            role: "Software Engineer Intern",
            startDate: "May 2022",
            endDate: "Aug 2022",
            current: false,
            description: "• Built real-time analytics dashboard using React and D3.js, processing 50K+ events/sec and improving load times by 40%\n• Optimized PostgreSQL queries reducing response time from 800ms to 120ms for 25K+ daily users\n• Implemented CI/CD pipeline with GitHub Actions, cutting deployment time by 65%"
        },
        {
            id: "exp-2",
            company: "StartupInc",
            role: "Full Stack Developer",
            startDate: "Jun 2023",
            endDate: "Present",
            current: true,
            description: "• Cleanly architected microservices e-commerce platform using Node.js and MongoDB, supporting 15K+ monthly transactions and $500K+ revenue\n• Led migration to Next.js with TypeScript, reducing bundle size by 45% and improving Core Web Vitals from 62 to 94\n• Deployed AWS serverless architecture (Lambda, DynamoDB), cutting infrastructure costs by $18K/month"
        }
    ],
    projects: [{
        id: "proj-1",
        name: "LoneStar Resume Builder",
        description: "• Built ATS-optimized SaaS platform using Next.js, TypeScript, and Tailwind CSS, serving 10K+ users with 4.8/5 rating\n• Integrated Gemini AI for resume analysis, processing 500+ daily requests with 95% accuracy",
        technologies: "Next.js, TypeScript, Tailwind CSS, Supabase, PostgreSQL, Gemini AI",
        link: "https://lonestar-resume.com"
    }],
    skills: ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express", "PostgreSQL", "MongoDB", "AWS (Lambda, S3, DynamoDB)", "Docker", "Git", "CI/CD", "REST APIs", "GraphQL", "Tailwind CSS"],
    customSections: [],
    sectionOrder: ['personal', 'education', 'experience', 'projects', 'skills'],
    sectionTitles: {},
    themeColor: '#3b82f6',
    contentScale: 1,
    fontFamily: 'roboto'
};

export function TemplateSelector() {
    const activeResumeId = useResumeStore(state => state.activeResumeId);
    const selectedTemplate = useResumeStore(state => state.activeResumeId ? state.resumes[state.activeResumeId]?.selectedTemplate : undefined) || 'classic';
    const setTemplate = useResumeStore(state => state.setTemplate);
    const loadExampleData = useResumeStore(state => state.loadExampleData);
    const resetResume = useResumeStore(state => state.resetResume);
    const userTier = useResumeStore(state => state.userTier);
    
    const [showTemplateUpgrade, setShowTemplateUpgrade] = React.useState(false);
    const themeColor = useResumeStore(state => state.activeResumeId ? state.resumes[state.activeResumeId]?.themeColor : '#3b82f6') || '#3b82f6';

    const templates = [
        { id: 'classic', name: 'Classic', icon: FileText, premium: false, comingSoon: false },
        { id: 'modern', name: 'Modern', icon: Layout, premium: false, comingSoon: false },
        { id: 'minimalist', name: 'Minimal', icon: PenTool, premium: false, comingSoon: false },
        { id: 'creative', name: 'Creative', icon: Palette, premium: true, comingSoon: false },
        { id: 'velvet', name: 'Velvet', icon: Sparkles, premium: true, comingSoon: false },
    ] as const;

    const handleTemplateChange = (value: string) => {
        const template = templates.find(t => t.id === value);
        if (template?.comingSoon) return;

        if (template?.premium && userTier === 'free') {
            setShowTemplateUpgrade(true);
            return;
        }
        setTemplate(value as any);
    };

    return (
        <TooltipProvider delayDuration={100}>
            <div className="mb-6 bg-white dark:bg-black rounded-lg shadow-sm border p-4">
            {/* Header / Title block */}
            <div className="flex justify-between items-center gap-4 flex-wrap mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
                        <Layout className="h-4 w-4" />
                    </div>
                    <div>
                        <Label className="text-sm font-semibold">Design Layout</Label>
                        <p className="text-xs text-muted-foreground">Select layout template</p>
                    </div>
                </div>

                <div className="ml-auto flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            if (activeResumeId && confirm("Are you sure you want to clear all resume data? This action cannot be undone.")) {
                                resetResume(activeResumeId);
                            }
                        }}
                        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Clear All Data"
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear All
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadExampleData}
                        className="gap-2"
                        title="Load Example Data"
                    >
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                        Auto-Fill
                    </Button>
                </div>
            </div>

            {/* Dropdown template selector */}
            <div className="flex items-center gap-2 flex-wrap">
                <Select
                    value={selectedTemplate}
                    onValueChange={handleTemplateChange}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue>
                            {(() => {
                                const selected = templates.find(t => t.id === selectedTemplate);
                                if (!selected) return "Select Template";
                                return (
                                    <span className="flex items-center gap-2">
                                        <selected.icon className="w-4 h-4" />
                                        {selected.name}
                                    </span>
                                );
                            })()}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {templates.map(t => (
                            <SelectItem
                                key={t.id}
                                value={t.id}
                                disabled={t.comingSoon}
                                className="p-0 group relative"
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center justify-between w-full min-w-[220px] py-1.5 pr-8 pl-2">
                                            <span className="flex items-center gap-2">
                                                <t.icon className="w-4 h-4" />
                                                {t.name}
                                            </span>
                                            
                                            <div className="flex items-center gap-2 ml-auto">
                                                {t.comingSoon ? (
                                                    <span className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Coming Soon</span>
                                                ) : (
                                                    t.premium && <Crown className="w-3 h-3 text-yellow-500 inline shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    {!t.comingSoon && (
                                        <TooltipContent 
                                            side="right" 
                                            align="center" 
                                            sideOffset={12}
                                            className="p-0 overflow-hidden bg-transparent border-0 shadow-2xl z-[100]"
                                        >
                                            <div className="relative w-[240px] h-[340px] overflow-hidden bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg shadow-lg">
                                                <div style={{ transform: 'scale(0.3022)', transformOrigin: 'top left', width: '794px', height: '1123px' }} className="absolute inset-0 pointer-events-none select-none">
                                                    <LiveResume
                                                        data={{
                                                            ...LOREM_RESUME_DATA,
                                                            selectedTemplate: t.id as any,
                                                            themeColor: themeColor
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>



            {/* Template Upgrade Dialog (For selector blocks) */}
            <Dialog open={showTemplateUpgrade} onOpenChange={setShowTemplateUpgrade}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-yellow-500" />
                            Premium Template
                        </DialogTitle>
                        <DialogDescription>
                            This is a premium template. Upgrade to Pro to unlock all premium templates and features.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 pt-4">
                        <UpgradeButton fullWidth />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
        </TooltipProvider>
    );
}
