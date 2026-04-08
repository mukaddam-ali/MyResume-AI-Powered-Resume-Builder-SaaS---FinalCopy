"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useResumeStore, ResumeData } from '@/store/useResumeStore';
import { Loader2, AlertCircle } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { ResumeDocument } from './ResumeDocument';
import { normalizeResumeData } from '@/lib/normalizeResume';
import { Button } from '@/components/ui/button';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

// Define window interface for global pdfjsLib
declare global {
    interface Window {
        pdfjsLib: any;
    }
}

interface ScriptPDFViewerProps {
    data: ResumeData;
    className?: string;
}

const PDFJS_VERSION = '4.8.69';
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.mjs`;
const PDFJS_WORKER_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

/**
 * Script-Injected PDF Viewer
 * 
 * Bypasses Next.js 16/Webpack compatibility issues by loading PDF.js 
 * directly from CDN at runtime via <script> tag injection.
 * 
 * This ensures the library never touches the build system.
 */
export default function ScriptPDFViewer({ data, className }: ScriptPDFViewerProps) {
    const userTier = useResumeStore((state) => state.userTier);
    const [libLoaded, setLibLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(1.5);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRefs = useRef<HTMLCanvasElement[]>([]);

    // Debounce first to prevent doing heavy normalization mapping on every keystroke
    const debouncedData = useDebouncedValue(data, 800);
    const normalizedData = React.useMemo(() => normalizeResumeData(debouncedData), [debouncedData]);

    // Track font registration to avoid redundant calls
    const fontsRegisteredRef = useRef(false);

    // 1. Inject Script
    useEffect(() => {
        if (window.pdfjsLib) {
            setLibLoaded(true);
            return;
        }

        const scriptId = 'pdfjs-script-injector';
        if (document.getElementById(scriptId)) {
            // Script already injecting, wait for event
            const checkInterval = setInterval(() => {
                if (window.pdfjsLib) {
                    setLibLoaded(true);
                    clearInterval(checkInterval);
                }
            }, 100);
            return () => clearInterval(checkInterval);
        }

        // Create script tag
        const script = document.createElement('script');
        script.id = scriptId;
        script.type = 'module';
        // We import and assign to window
        script.textContent = `
            import * as pdfjsLib from '${PDFJS_CDN}';
            window.pdfjsLib = pdfjsLib;
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDFJS_WORKER_CDN}';
            window.dispatchEvent(new Event('pdfjsLoaded'));
        `;

        document.body.appendChild(script);

        const handleLoad = () => setLibLoaded(true);
        window.addEventListener('pdfjsLoaded', handleLoad);

        return () => {
            window.removeEventListener('pdfjsLoaded', handleLoad);
        };
    }, []);

    // 2. Render PDF
    useEffect(() => {
        if (!libLoaded) return;

        let cancelled = false;

        const renderPDF = async () => {
            try {
                setLoading(true);
                setError(null);

                // Register fonts (only once)
                if (!fontsRegisteredRef.current) {
                    const { registerClientFonts } = await import('@/lib/fonts-client');
                    registerClientFonts();
                    fontsRegisteredRef.current = true;
                }

                // Generate Blob
                const doc = <ResumeDocument data={normalizedData} userTier={userTier} />;
                const blob = await pdf(doc).toBlob();
                const arrayBuffer = await blob.arrayBuffer();

                // Load Document using Global Lib
                const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
                const pdfDocument = await loadingTask.promise;

                if (cancelled) return;

                setNumPages(pdfDocument.numPages);
                canvasRefs.current = []; // Reset refs

                // Render Pages
                for (let i = 1; i <= pdfDocument.numPages; i++) {
                    if (cancelled) break;

                    const page = await pdfDocument.getPage(i);

                    // High-DPI Scaling Logic
                    // 1. Get device pixel ratio (e.g., 2 for Retina)
                    // 2. Render canvas at higher resolution
                    // 3. Display at logical CSS size
                    const pixelRatio = window.devicePixelRatio || 1;
                    const viewport = page.getViewport({ scale: scale * pixelRatio });

                    // Create Canvas
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    if (!context) continue;

                    // Set actual canvas capability (high res)
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    // Set display size (logical scale)
                    canvas.style.width = `${viewport.width / pixelRatio}px`;
                    canvas.style.height = `${viewport.height / pixelRatio}px`;
                    canvas.className = 'shadow-md mb-4 bg-white mx-auto';

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport,
                        intent: 'display', // Optimizes for screen playback
                        enableWebGL: true,
                        renderInteractiveForms: false,
                    };

                    await page.render(renderContext).promise;

                    if (!cancelled) {
                        canvasRefs.current.push(canvas);
                    }
                }

                // Append to DOM
                if (containerRef.current && !cancelled) {
                    containerRef.current.innerHTML = '';
                    canvasRefs.current.forEach(canvas => {
                        containerRef.current?.appendChild(canvas);
                    });
                }

            } catch (err) {
                console.error("PDF Render Error:", err);
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to render PDF");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        renderPDF();

        return () => {
            cancelled = true;
        };
    }, [libLoaded, normalizedData, userTier, scale]);

    // Responsive Scale
    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const width = containerRef.current.clientWidth;
                // Standard letter width ~600px at scale 1
                const newScale = Math.min(Math.max(width / 650, 0.6), 2.0);
                setScale(newScale);
            }
        };

        window.addEventListener('resize', updateScale);
        updateScale();

        return () => window.removeEventListener('resize', updateScale);
    }, []);

    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-slate-900/50 ${className}`}>
                <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
                <p className="text-red-600 font-medium">Preview Failed</p>
                <p className="text-xs text-red-400 max-w-xs text-center">{error}</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full bg-gray-100 dark:bg-slate-900 relative ${className}`}>
            {(loading || !libLoaded) && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            )}

            <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-8 flex flex-col items-center scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700">
                {/* Canvases injected here */}
            </div>
        </div>
    );
}
