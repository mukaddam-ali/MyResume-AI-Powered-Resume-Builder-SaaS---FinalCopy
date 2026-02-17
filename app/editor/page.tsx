"use client";

import { useEffect, useState } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { EditorPanel } from "@/components/editor/EditorPanel";
import { PreviewPanel } from "@/components/preview/PreviewPanel";
import { MobileViewToggle } from "@/components/editor/MobileViewToggle";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AutoSaveHandler } from "@/components/editor/AutoSaveHandler";

export default function EditorPage() {
    const { resumes, activeResumeId, addResume, setActiveResume } = useResumeStore();
    const router = useRouter();
    const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

    useEffect(() => {
        // If store is not hydrated yet, wait (if we had a hydration flag). 
        // Assuming persist works reasonably fast.

        // Use a timeout to allow hydration
        const timer = setTimeout(() => {
            if (activeResumeId) return;

            const resumeIds = Object.keys(resumes);
            if (resumeIds.length > 0) {
                setActiveResume(resumeIds[0]);
            } else {
                addResume("My First Resume");
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [resumes, activeResumeId, addResume, setActiveResume]);

    const toggleMobileView = () => {
        setMobileView(prev => prev === 'editor' ? 'preview' : 'editor');
    };

    return (
        <div className="flex flex-col lg:flex-row flex-1 min-h-screen gap-6 bg-background px-4 sm:px-8 lg:px-12">
            <AutoSaveHandler />

            {/* Left Panel - Editor */}
            <div className={`w-full lg:flex-1 bg-background max-w-full min-w-0 ${mobileView === 'preview' ? 'hidden lg:block' : ''}`}>
                <EditorPanel />
            </div>

            {/* Right Panel - Preview (Sticky) */}
            <div className={`w-full lg:w-[50%] xl:w-[45%] lg:h-screen sticky top-0 self-start lg:overflow-hidden min-w-0 ${mobileView === 'editor' ? 'hidden lg:block' : ''}`}>
                <PreviewPanel />
            </div>

            {/* Mobile View Toggle FAB */}
            <MobileViewToggle currentView={mobileView} onToggle={toggleMobileView} />
        </div>
    );
}
