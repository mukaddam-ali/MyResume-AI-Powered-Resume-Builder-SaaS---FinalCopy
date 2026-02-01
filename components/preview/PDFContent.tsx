"use client";

import React from 'react';
import { usePDF } from '@react-pdf/renderer';
import { ResumeDocument } from './ResumeDocument';
import { ResumeData } from '@/store/useResumeStore';
import { Loader2 } from 'lucide-react';

interface PDFContentProps {
    data: ResumeData;
    className?: string;
}

export default function PDFContent({ data, className }: PDFContentProps) {
    const [instance, updateInstance] = usePDF({
        document: <ResumeDocument data={data} userTier="pro" />
    });

    // Update instance when data changes
    React.useEffect(() => {
        updateInstance(<ResumeDocument data={data} userTier="pro" />);
    }, [data, updateInstance]);

    if (instance.loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (instance.error) {
        return <div className="p-4 text-red-500">Error generating PDF: {instance.error}</div>;
    }

    return (
        <iframe
            src={`${instance.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            className={`w-full h-full border-0 ${className || ''}`}
            title="Resume PDF Preview"
        />
    );
}
