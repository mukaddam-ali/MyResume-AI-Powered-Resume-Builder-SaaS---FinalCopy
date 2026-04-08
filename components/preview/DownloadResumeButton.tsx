"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useResumeStore, ResumeData } from "@/store/useResumeStore";

interface DownloadResumeButtonProps {
    fileName?: string;
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    data: ResumeData;
    size?: "default" | "sm" | "lg" | "icon";
}

export const DownloadResumeButton = ({
    fileName = "resume.pdf",
    className,
    variant = "outline",
    size = "default",
    data
}: DownloadResumeButtonProps) => {
    const userTier = useResumeStore((state) => state.userTier);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        try {
            setIsGenerating(true);

            // Dynamic import to avoid SSR issues
            const { pdf } = await import('@react-pdf/renderer');
            const { ResumeDocument } = await import('./ResumeDocument');
            const { normalizeResumeData } = await import('@/lib/normalizeResume');

            // Normalize data
            const normalizedData = normalizeResumeData(data);

            // Generate Blob client-side
            const blob = await pdf(<ResumeDocument data={normalizedData} userTier={userTier} />).toBlob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            className={className}
            onClick={handleDownload}
            disabled={isGenerating}
            title="Download PDF (Print)"
        >
            {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4" />
            )}
            {size !== "icon" && (isGenerating ? "Preparing..." : "Download PDF")}
        </Button>
    );
};
