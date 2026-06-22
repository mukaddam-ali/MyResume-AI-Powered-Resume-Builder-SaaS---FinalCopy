"use client";
import React, { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ResumeDocument } from './ResumeDocument';
import { useResumeStore } from '@/store/useResumeStore';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { Loader2 } from 'lucide-react';
import { PDFErrorBoundary } from './PDFErrorBoundary';
import { registerClientFonts } from '@/lib/fonts-client';
import { normalizeResumeData } from '@/lib/normalizeResume';

// Dynamic import with SSR disabled to avoid hydration mismatches
const PDFViewer = dynamic(
    () => import('@react-pdf/renderer').then(mod => mod.PDFViewer),
    {
        ssr: false,
        loading: () => (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ),
    }
);

interface PDFLivePreviewProps {
    zoom?: number;
}

/**
 * PDF-First Live Preview Component
 * Renders the resume using @react-pdf/renderer's built-in viewer
 * capable of rendering PDF via JS (pdf.js) avoids browser plugin issues.
 */
export function PDFLivePreview({ zoom = 100 }: PDFLivePreviewProps) {
    const activeResumeId = useResumeStore((state) => state.activeResumeId);
    const activeResume = useResumeStore((state) => state.activeResumeId ? state.resumes[state.activeResumeId] : null);
    const userTier = useResumeStore((state) => state.userTier);

    // Debounce resume data to avoid re-rendering PDF on every keystroke
    const debouncedResume = useDebouncedValue(activeResume, 500);
    const normalizedResume = useMemo(() => normalizeResumeData(debouncedResume), [debouncedResume]);

    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        registerClientFonts();
    }, []);

    // Show empty state if no resume is active
    if (!activeResume) {
        return (
            <div className="flex h-full items-center justify-center bg-muted/30 text-muted-foreground">
                <div className="text-center p-6">
                    <p>No resume selected.</p>
                </div>
            </div>
        );
    }

    if (!isClient) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            {/* Updating indicator */}
            {activeResume !== debouncedResume && (
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded-md shadow-lg transition-opacity">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating...</span>
                </div>
            )}

            <div className="w-full h-full flex items-start justify-start overflow-auto bg-gradient-to-b from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950 p-8">
                <PDFErrorBoundary>
                    {debouncedResume && (
                        <PDFViewer
                            showToolbar={false}
                            className="shadow-lg bg-white"
                            style={{
                                width: `${794 * (zoom / 100)}px`,
                                height: `${1123 * (zoom / 100)}px`,
                                minWidth: `${794 * (zoom / 100)}px`,
                                minHeight: `${1123 * (zoom / 100)}px`,
                                border: 'none',
                            }}
                        >
                            <ResumeDocument data={normalizedResume} userTier={userTier} />
                        </PDFViewer>
                    )}
                </PDFErrorBoundary>
            </div>
        </div>
    );
}
