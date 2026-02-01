"use client";

import { useResumeStore } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, ZoomIn, ZoomOut } from "lucide-react";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { DownloadResumeButton } from "./DownloadResumeButton";

// Load UniversalPDFPreview - automatically detects browser and uses optimal renderer
const UniversalPDFPreview = dynamic(() => import("./UniversalPDFPreview"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
    ),
});

// Wrapper to handle SearchParams without Suspense boundary issues
const PaymentHandler = ({ setHasPaid }: { setHasPaid: (val: boolean) => void }) => {
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get("success") === "true") {
            setHasPaid(true);
        }
    }, [searchParams, setHasPaid]);

    return null;
}

export function PreviewPanel() {
    const { resumes, activeResumeId } = useResumeStore();
    const activeResume = activeResumeId ? resumes[activeResumeId] : null;

    const [client, setClient] = useState(false);
    const [hasPaid, setHasPaid] = useState(true);
    const [loading, setLoading] = useState(false);
    const [zoom, setZoom] = useState(100);

    useEffect(() => {
        setClient(true);
    }, []);

    const handleUnlock = async () => {
        setLoading(true);
        try {
            // Call Stripe API
            const response = await fetch("/api/stripe/checkout_session", {
                method: "POST",
            });
            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Payment initialization failed.");
            }
        } catch (error) {
            console.error("Payment error:", error);
            alert("Something went wrong with the payment mechanism.");
        } finally {
            setLoading(false);
        }
    };

    if (!client) return null;

    if (!activeResume) {
        return (
            <div className="flex h-full items-center justify-center bg-muted/30 text-muted-foreground">
                <div className="text-center p-6">
                    <p>No resume selected.</p>
                    <p className="text-sm">Create or select one to see preview.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col relative border-t dark:border-transparent bg-slate-50 dark:bg-slate-950 z-0">
            {/* Search Params Listener */}
            <React.Suspense fallback={null}>
                <PaymentHandler setHasPaid={setHasPaid} />
            </React.Suspense>

            {/* Header */}
            <div className="py-4 px-8 border-b dark:border-slate-800 shrink-0 z-10 bg-white/50 dark:bg-transparent backdrop-blur-sm">
                <div className="w-full flex justify-between items-center px-8">
                    <div className="flex items-center gap-4">
                        <h2 className="font-semibold text-slate-700 dark:text-slate-200">Real PDF Preview</h2>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                            <span className="text-xs text-slate-500">Auto-updates on change</span>
                        </div>
                    </div>
                    {!hasPaid ? (
                        <Button
                            size="sm"
                            onClick={handleUnlock}
                            disabled={loading}
                            className="bg-texastech-red hover:bg-texastech-red/90 text-white gap-2 shadow-sm"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                            Unlock Download ($9)
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <DownloadResumeButton
                                key={activeResume.lastModified}
                                fileName={`${activeResume.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`}
                                data={activeResume}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div id="preview-container" className="flex-1 overflow-hidden relative bg-gray-200 dark:bg-slate-900">
                {/* Universal PDF Preview - Auto-detects browser for optimal rendering */}
                <UniversalPDFPreview
                    data={activeResume}
                    className="h-full w-full"
                />
            </div>
        </div >
    );
}
