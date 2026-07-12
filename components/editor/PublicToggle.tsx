"use client";

import { useResumeStore } from "@/store/useResumeStore";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Copy, Check, ExternalLink } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

export function PublicToggle() {
    const { activeResumeId, resumes, toggleResumeVisibility } = useResumeStore();
    const activeResume = activeResumeId ? resumes[activeResumeId] : null;
    const [copied, setCopied] = useState(false);

    if (!activeResume) return null;

    const isPublic = activeResume.isPublic || false;

    // Build the public portfolio URL using the resumeId
    const portfolioUrl = typeof window !== "undefined"
        ? `${window.location.origin}/p/${activeResume.id}`
        : `/p/${activeResume.id}`;

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(portfolioUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
        }
    };

    return (
        <TooltipProvider>
            <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => toggleResumeVisibility(activeResume.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && toggleResumeVisibility(activeResume.id)}
                            aria-label={isPublic ? "Make resume private" : "Make resume public"}
                        >
                            {isPublic ? (
                                <Eye className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                            ) : (
                                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="text-xs font-medium">
                                {isPublic ? "Public" : "Private"}
                            </span>
                            <Switch
                                checked={isPublic}
                                onCheckedChange={() => toggleResumeVisibility(activeResume.id)}
                                className="data-[state=checked]:bg-green-600"
                                aria-label="Toggle public/private resume visibility"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-sm">
                            {isPublic ? (
                                <>
                                    <strong>Public Portfolio:</strong> Your resume is live and shareable.
                                    Anyone with the link can view it. Your email, phone, and photo are
                                    never included in the public version.
                                </>
                            ) : (
                                <>
                                    <strong>Private Resume:</strong> Only you can see this.
                                    Enable to get a shareable portfolio link (requires sign-in;
                                    contact details are stripped from the public version).
                                </>
                            )}
                        </p>
                    </TooltipContent>
                </Tooltip>

                {/* Share URL badge — only shown when public */}
                {isPublic && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50 text-xs font-medium text-green-700 dark:text-green-400 max-w-[180px] overflow-hidden">
                                <ExternalLink className="h-3 w-3 shrink-0" />
                                <span className="truncate">/p/{activeResume.id.substring(0, 8)}…</span>
                                <button
                                    onClick={handleCopy}
                                    className="ml-1 shrink-0 hover:text-green-900 dark:hover:text-green-200 transition-colors"
                                    aria-label="Copy portfolio link"
                                >
                                    {copied ? (
                                        <Check className="h-3 w-3 text-green-600" />
                                    ) : (
                                        <Copy className="h-3 w-3" />
                                    )}
                                </button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p className="text-xs font-mono">{portfolioUrl}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Click copy to share your portfolio</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    );
}
