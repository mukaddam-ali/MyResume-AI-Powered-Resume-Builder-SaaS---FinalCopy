"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { ResumeData } from '@/store/useResumeStore';
import { Loader2 } from 'lucide-react';
import { normalizeResumeData } from '@/lib/normalizeResume';

// Dynamically import the component that uses usePDF hook
const PDFContent = dynamic(
    () => import('./PDFContent'),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        ),
    }
);

interface ClientPDFPreviewProps {
    data: ResumeData;
    className?: string;
}

import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

// ... (imports)

export default function ClientPDFPreview({ data, className }: ClientPDFPreviewProps) {
    const [isMounted, setIsMounted] = React.useState(false);
    const [fontsReady, setFontsReady] = React.useState(false);

    // Ensure component only renders on client-side after mount
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // Register fonts on client-side only
    React.useEffect(() => {
        if (!isMounted) return;

        const registerFonts = async () => {
            const { registerClientFonts } = await import('@/lib/fonts-client');
            registerClientFonts();
            setFontsReady(true);
        };
        registerFonts();
    }, [isMounted]);

    // Normalize data client-side (same logic as server)
    const normalizedData = React.useMemo(() => normalizeResumeData(data), [data]);

    // Debounce the data to prevent excessive remounts/PDF generation
    // 600ms delay to ensure user stopped typing
    const debouncedData = useDebouncedValue(normalizedData, 600);

    // Don't render anything during SSR or before fonts are ready
    if (!isMounted || !fontsReady || typeof window === 'undefined') {
        return (
            <div className={className}>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <PDFContent
                // Remount completely when data changes to avoid standard "updateInstance" bugs in react-pdf
                key={debouncedData.lastModified}
                data={debouncedData}
                className="w-full h-full border-0"
            />
        </div>
    );
}
