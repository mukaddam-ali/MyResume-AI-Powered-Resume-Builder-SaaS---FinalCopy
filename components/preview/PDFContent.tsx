"use client";

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { ResumeDocument } from './ResumeDocument';
import { useResumeStore, ResumeData } from '@/store/useResumeStore';
import { Loader2 } from 'lucide-react';

interface PDFContentProps {
    data: ResumeData;
    className?: string;
}

/**
 * Uses pdf() async API instead of BlobProvider.
 *
 * BlobProvider is a React component that calls into the @react-pdf/renderer
 * Yoga layout engine SYNCHRONOUSLY during render. If the engine's internal
 * WASM/asm.js module hasn't fully initialized yet, this throws:
 *   "Eo is not a function"
 *
 * By calling pdf() inside a useEffect (after React commits), we guarantee
 * the engine is invoked outside the render phase, avoiding the race condition
 * entirely — regardless of browser or timing.
 */
export default function PDFContent({ data, className }: PDFContentProps) {
    const userTier = useResumeStore((state) => state.userTier);
    const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let objectUrl: string | null = null;
        let cancelled = false;

        const generate = async () => {
            setLoading(true);
            setError(null);

            try {
                const doc = <ResumeDocument data={data} userTier={userTier} />;
                const blob = await pdf(doc).toBlob();

                if (cancelled) return;

                // Revoke previous URL to avoid memory leaks
                if (objectUrl) URL.revokeObjectURL(objectUrl);
                objectUrl = URL.createObjectURL(blob);
                setBlobUrl(objectUrl);
            } catch (err: any) {
                if (!cancelled) {
                    console.error('PDF generation failed:', err);
                    setError(err?.message ?? 'Failed to generate PDF');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        generate();

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [data, userTier]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-500 text-sm">
                Error generating PDF preview: {error}
            </div>
        );
    }

    if (!blobUrl) return null;

    return (
        <iframe
            key={blobUrl}
            src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            className={`w-full h-full border-0 ${className || ''}`}
            title="Resume PDF Preview"
        />
    );
}
