"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { ResumeData } from '@/store/useResumeStore';
import { Loader2 } from 'lucide-react';
import { normalizeResumeData } from '@/lib/normalizeResume';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

// Dynamically import PDFContent (uses @react-pdf/renderer — client only)
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

export default function ClientPDFPreview({ data, className }: ClientPDFPreviewProps) {
    const [isMounted, setIsMounted] = React.useState(false);

    // Ensure we only render on the client
    React.useEffect(() => {
        setIsMounted(true);

        // Register fonts once — PDFContent's useEffect will use them
        import('@/lib/fonts-client').then(({ registerClientFonts }) => {
            registerClientFonts();
        });
    }, []);

    // Debounce to avoid heavy normalization on every keystroke
    const debouncedData = useDebouncedValue(data, 800);
    const normalizedData = React.useMemo(() => normalizeResumeData(debouncedData), [debouncedData]);

    if (!isMounted || typeof window === 'undefined') {
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
                data={normalizedData}
                className="w-full h-full border-0"
            />
        </div>
    );
}
