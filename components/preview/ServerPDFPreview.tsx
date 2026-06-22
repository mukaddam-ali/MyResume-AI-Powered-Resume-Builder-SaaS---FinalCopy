"use client";

import React, { useEffect, useState, useRef } from "react";
import { ResumeData } from "@/store/useResumeStore";
import { Loader2 } from "lucide-react";
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

interface ServerPDFPreviewProps {
    data: ResumeData;
    className?: string;
}

export default function ServerPDFPreview({ data, className }: ServerPDFPreviewProps) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Debounce data
    const debouncedData = useDebouncedValue(data, 1000);

    // Fetch PDF logic
    useEffect(() => {
        let active = true;

        const fetchPDF = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch('/api/export-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(debouncedData),
                });

                if (!response.ok) {
                    let errorMessage = "Failed to generate PDF";
                    let isFontError = false;

                    try {
                        const errorData = await response.json();
                        console.error("PDF Generation failed:", errorData);
                        if (errorData) {
                            // Use the specific error message from the server if available
                            const serverError = errorData.error || errorData.details;
                            if (serverError) {
                                errorMessage = serverError;

                                // Only append font suggestion if it's explicitly identified as a font error
                                if (errorData.isFontError) {
                                    errorMessage += " (This may be a font issue. Try a different font.)";
                                }
                            }
                        }
                    } catch (parseError) {
                        console.error("Failed to parse error response:", parseError);
                        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    }
                    throw new Error(errorMessage);
                }

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);

                if (active) {
                    setPdfUrl(prev => {
                        if (prev) URL.revokeObjectURL(prev); // Cleanup old URL
                        return url;
                    });
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load PDF preview.";
                console.error("PDF Preview Error:", err);
                if (active) setError(errorMessage);
            } finally {
                if (active) setLoading(false);
            }
        };

        if (debouncedData) {
            fetchPDF();
        }

        return () => {
            active = false;
        };
    }, [debouncedData]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [pdfUrl]);

    return (
        <div className={`relative w-full h-full flex flex-col items-center bg-gray-100 dark:bg-zinc-950 ${className}`}>
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 font-medium text-sm text-gray-600 dark:text-gray-300">Generating Preview...</span>
                </div>
            )}

            {error ? (
                <div className="flex items-center justify-center h-full">
                    <div className="text-red-500 font-medium">{error}</div>
                </div>
            ) : pdfUrl ? (
                <iframe
                    ref={iframeRef}
                    src={`${pdfUrl}#view=FitH`}
                    className="w-full h-full border-0"
                    title="Resume PDF Preview"
                />
            ) : (
                <div className="flex items-center justify-center h-full">
                    <div className="text-gray-400">Preparing preview...</div>
                </div>
            )}
        </div>
    );
}
