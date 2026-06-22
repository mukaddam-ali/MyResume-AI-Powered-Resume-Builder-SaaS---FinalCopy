"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ResumeData } from '@/store/useResumeStore';
import { Loader2 } from 'lucide-react';

// Dynamically import both preview components
const ClientPDFPreview = dynamic(() => import('./ClientPDFPreview'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
    ),
});

const ScriptPDFViewer = dynamic(() => import('./ScriptPDFViewer'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
    ),
});

interface UniversalPDFPreviewProps {
    data: ResumeData;
    className?: string;
}

/**
 * Universal PDF Preview Component
 * 
 * Automatically detects the browser and uses the optimal rendering strategy:
 * - Chrome: Uses Script-injected PDF.js (bypasses build system issues)
 * - Edge/Safari/Firefox: Uses blob URL with iframe for better performance
 * 
 * The <script> tag approach avoids Next.js 16/Webpack compatibility issues
 * by loading the library at runtime from CDN.
 */
export default function UniversalPDFPreview({ data, className }: UniversalPDFPreviewProps) {
    const [renderMode, setRenderMode] = useState<'blob' | 'script' | null>(null);

    useEffect(() => {
        // Browser detection
        const userAgent = navigator.userAgent;
        const vendor = navigator.vendor;

        // Detect Chrome (but NOT Edge, which also reports Chrome in UA)
        const isChrome = /Chrome/.test(userAgent) &&
            /Google Inc/.test(vendor) &&
            !/Edg/.test(userAgent);

        // Chrome gets local script injection rendering, everything else gets blob iframe
        setRenderMode(isChrome ? 'script' : 'blob');

        console.log('🔍 Browser Detection:', {
            userAgent: userAgent.substring(0, 50),
            vendor,
            isChrome,
            renderMode: isChrome ? 'script' : 'blob'
        });
    }, []);

    // Show loading state until we determine which renderer to use
    if (!renderMode) {
        return (
            <div className={`flex items-center justify-center h-full ${className}`}>
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    // Render based on browser capabilities (fallback to script if needed)
    if (renderMode === 'script') {
        return <ScriptPDFViewer data={data} className={className} />;
    }

    return <ClientPDFPreview data={data} className={className} />;
}
