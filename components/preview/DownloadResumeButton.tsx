"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ShieldCheck, ChevronDown, FileText } from "lucide-react";
import { useResumeStore, ResumeData } from "@/store/useResumeStore";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    const [isGenerating, setIsGenerating] = useState<null | 'standard' | 'ats' | 'docx'>(null);

    const handleDocx = async () => {
        try {
            setIsGenerating('docx');
            const { normalizeResumeData } = await import('@/lib/normalizeResume');
            const { generateDocx } = await import('@/lib/docxExport');
            const blob = await generateDocx(normalizeResumeData(data));

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName.replace(/\.pdf$/i, '') + '.docx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Error generating DOCX:", error);
            alert("Failed to generate the Word document. Please try again.");
        } finally {
            setIsGenerating(null);
        }
    };

    const handleDownload = async (mode: 'standard' | 'ats') => {
        try {
            setIsGenerating(mode);

            // Dynamic import to avoid SSR issues
            const { pdf } = await import('@react-pdf/renderer');
            const { ResumeDocument } = await import('./ResumeDocument');
            const { normalizeResumeData } = await import('@/lib/normalizeResume');

            let exportData = normalizeResumeData(data);
            let name = fileName;
            if (mode === 'ats') {
                const { toAtsSafeResume } = await import('@/lib/atsSafe');
                exportData = toAtsSafeResume(exportData);
                name = fileName.replace(/\.pdf$/i, '') + '_ATS_Safe.pdf';
            }

            const blob = await pdf(<ResumeDocument data={exportData} userTier={userTier} />).toBlob();

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsGenerating(null);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    className={className}
                    disabled={isGenerating !== null}
                    title="Download PDF"
                >
                    {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    {size !== "icon" && (isGenerating ? "Preparing..." : "Download PDF")}
                    {size !== "icon" && !isGenerating && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={() => handleDownload('standard')} className="gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    <div>
                        <div className="font-medium">Standard PDF</div>
                        <div className="text-xs text-muted-foreground">Your selected template & styling</div>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('ats')} className="gap-2 cursor-pointer">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <div>
                        <div className="font-medium">ATS-Safe PDF</div>
                        <div className="text-xs text-muted-foreground">Single column, standard headings, no photo — maximum parseability</div>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDocx} className="gap-2 cursor-pointer">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <div>
                        <div className="font-medium">Word (.docx)</div>
                        <div className="text-xs text-muted-foreground">Editable document for recruiters who ask for Word</div>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
