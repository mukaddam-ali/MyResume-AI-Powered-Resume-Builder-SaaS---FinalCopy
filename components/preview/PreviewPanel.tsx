"use client";

import { useResumeStore } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Maximize2, Minus, Plus, RotateCcw, X, Flame } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Slider } from "@/components/ui/slider";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { DownloadResumeButton } from "./DownloadResumeButton";
import { HeatmapOverlay } from "./HeatmapOverlay";
import { useAuth } from "@/lib/auth-context";

// Load UniversalPDFPreview - automatically detects browser and uses optimal renderer
const UniversalPDFPreview = dynamic(() => import("./UniversalPDFPreview"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
    ),
});

// Wrapper to handle SearchParams without Suspense boundary issues
const URLParamsHandler = ({ setShowCaution }: { setShowCaution: (val: boolean) => void }) => {
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get("imported") === "true") {
            setShowCaution(true);
        }
    }, [searchParams, setShowCaution]);

    return null;
}

export function PreviewPanel() {
    const activeResumeId = useResumeStore(state => state.activeResumeId);
    const activeResume = useResumeStore(state => state.activeResumeId ? state.resumes[state.activeResumeId] : null);
    const setContentScale = useResumeStore(state => state.setContentScale);
    const setSectionSpacing = useResumeStore(state => state.setSectionSpacing);
    const { isPremium } = useAuth();

    const [client, setClient] = useState(false);
    const [showCaution, setShowCaution] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [heatmapActive, setHeatmapActive] = useState(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsFullscreen(false);
            }
        };
        if (isFullscreen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isFullscreen]);

    useEffect(() => {
        setClient(true);
    }, []);

    if (!client) return null;

    if (!activeResume) {
        return (
            <div className="flex h-full items-center justify-center bg-muted/30 text-muted-foreground">
                <div className="text-center p-6">
                    <p>No resume selected.</p>
                    <p className="text-sm">Create or select one to see preview.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col relative border-t dark:border-transparent bg-slate-50 dark:bg-background z-0">
            {/* Search Params Listener */}
            <React.Suspense fallback={null}>
                <URLParamsHandler setShowCaution={setShowCaution} />
            </React.Suspense>

            {/* Header */}
            <div className="py-4 pl-4 sm:pl-8 lg:pl-12 pr-4 border-b dark:border-border shrink-0 z-10 bg-white/50 dark:bg-transparent backdrop-blur-sm">
                <div className="flex flex-col gap-4">
                    <div className="w-full flex justify-between items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-3">
                            <h2 className="font-semibold text-slate-700 dark:text-slate-200">Real PDF Preview</h2>
                            {/* Heatmap Toggle */}
                            <Button
                                variant={heatmapActive ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                    if (!isPremium) {
                                        alert("🔥 Recruiter Heatmap is a PRO feature. Upgrade to visualize where recruiters' eyes go on your resume!");
                                        return;
                                    }
                                    setHeatmapActive(prev => !prev);
                                }}
                                className={`gap-1.5 text-xs h-8 transition-all ${
                                    heatmapActive
                                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent hover:from-orange-600 hover:to-red-600 shadow-md shadow-orange-500/30"
                                        : "border-orange-300 text-orange-600 dark:text-orange-400 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                }`}
                                title={isPremium ? "Toggle Recruiter Eye-Tracking Heatmap" : "PRO: Recruiter Heatmap"}
                                aria-label="Toggle recruiter heatmap overlay"
                            >
                                <Flame className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{heatmapActive ? "Heatmap ON" : "Heatmap"}</span>
                                {!isPremium && <span className="text-[9px] px-1 py-0.5 rounded bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 font-bold ml-0.5">PRO</span>}
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <DownloadResumeButton
                                key={activeResume.lastModified}
                                fileName={`${activeResume.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`}
                                data={activeResume}
                            />
                        </div>
                    </div>
                    {showCaution && (
                        <div className="flex items-start gap-2.5 bg-amber-50/80 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-200/60 dark:border-amber-500/20">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                            <p className="text-sm text-amber-800 dark:text-amber-200/90 leading-tight">
                                <span className="font-semibold">Caution:</span> Document scales may overlap if text is too large. Use the general scale to adjust the overall fit.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div id="preview-container" ref={previewContainerRef} className="flex-1 overflow-hidden relative bg-gray-200 dark:bg-zinc-950">
                {/* Universal PDF Preview - Auto-detects browser for optimal rendering */}
                <UniversalPDFPreview
                    data={activeResume}
                    className="h-full w-full"
                />

                {/* Heatmap Overlay */}
                {heatmapActive && isPremium && (
                    <HeatmapOverlay resumeData={activeResume} containerRef={previewContainerRef} />
                )}

                {/* Fullscreen Toggle Button */}
                <button
                    onClick={() => setIsFullscreen(true)}
                    className="hidden md:block absolute bottom-6 right-6 p-3 bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-100 rounded-full shadow-2xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all duration-200 z-20 group"
                    title="Fullscreen Preview"
                    aria-label="Fullscreen Preview"
                >
                    <Maximize2 className="h-5 w-5 group-hover:rotate-45 transition-transform duration-200" />
                </button>
            </div>

            {/* Fullscreen Portal */}
            {isFullscreen && typeof window !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[9999] bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col font-sans text-slate-800 dark:text-white">
                    {/* Header */}
                    <div className="h-16 border-b border-slate-200 dark:border-white/10 px-6 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold tracking-wide text-slate-800 dark:text-slate-100">Fullscreen Preview</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 font-medium">Interactive</span>
                        </div>
                        {/* Zoom Controls */}
                        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                            <button
                                onClick={() => setZoom(prev => Math.max(50, prev - 10))}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-md transition-colors hover:text-slate-900 dark:hover:text-white"
                                title="Zoom Out"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-mono text-sm px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-md min-w-[60px] text-center border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200">
                                {zoom}%
                            </span>
                            <button
                                onClick={() => setZoom(prev => Math.min(200, prev + 10))}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-md transition-colors hover:text-slate-900 dark:hover:text-white"
                                title="Zoom In"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setZoom(100)}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-md transition-colors text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 flex items-center gap-1.5"
                                title="Reset Zoom"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset
                            </button>
                        </div>
                        {/* Close button */}
                        <button
                            onClick={() => setIsFullscreen(false)}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-md transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                            title="Close (Esc)"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 overflow-auto flex p-8 bg-slate-200/40 dark:bg-slate-900/10">
                        <div 
                            style={{ 
                                width: `${794 * (zoom / 100)}px`, 
                                height: `${1123 * (zoom / 100)}px`,
                                minWidth: `${794 * (zoom / 100)}px`,
                                minHeight: `${1123 * (zoom / 100)}px`
                            }} 
                            className="relative shadow-2xl transition-all duration-200 bg-white m-auto"
                        >
                            <div 
                                style={{ 
                                    transform: `scale(${zoom / 100})`, 
                                    transformOrigin: 'top left',
                                    width: '794px',
                                    height: '1123px'
                                }} 
                                className="absolute inset-0"
                            >
                                <UniversalPDFPreview
                                    data={activeResume}
                                    className="h-full w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div >
    );
}
