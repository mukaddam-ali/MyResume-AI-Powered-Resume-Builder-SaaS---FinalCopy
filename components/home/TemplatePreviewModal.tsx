"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeData } from "@/store/useResumeStore";
import dynamic from "next/dynamic";

// Dynamically import LiveResume to avoid SSR issues
const LiveResume = dynamic(() => import("@/components/preview/LiveResume"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    ),
});

interface TemplatePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUse: () => void;
    template: {
        resumeName: string;
        templateType: string;
        resumeData: ResumeData;
    } | null;
}

export function TemplatePreviewModal({
    isOpen,
    onClose,
    onUse,
    template,
}: TemplatePreviewModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleKey);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleKey);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    // Close on backdrop click (but not on modal content click)
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && template && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleBackdropClick}
                    aria-modal="true"
                    role="dialog"
                    aria-label={`Preview of ${template.resumeName}`}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                    {/* Modal Panel */}
                    <motion.div
                        ref={modalRef}
                        className="relative z-10 flex flex-col bg-background border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden"
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                            <div>
                                <h2 className="font-bold text-lg truncate">{template.resumeName}</h2>
                                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize mt-1">
                                    {template.templateType}
                                </span>
                            </div>
                            <button
                                id="template-preview-close-btn"
                                onClick={onClose}
                                className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label="Close preview"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Preview Area — scrollable */}
                        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 flex items-start justify-center p-6 md:p-10">
                            {/* Scale the 794px-wide resume down to fit the modal */}
                            <div
                                className="origin-top"
                                style={{
                                    transform: "scale(0.72)",
                                    transformOrigin: "top center",
                                    width: "794px",
                                    marginBottom: "-270px", // offset the visual gap created by scale
                                }}
                            >
                                <LiveResume data={template.resumeData} scale={1} />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-background shrink-0">
                            <Button
                                id="template-preview-cancel-btn"
                                variant="outline"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                id="template-preview-use-btn"
                                onClick={() => {
                                    onUse();
                                    onClose();
                                }}
                                className="gap-2"
                            >
                                <Copy className="h-4 w-4" />
                                Use This Template
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
