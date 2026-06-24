"use client";

import { useResumeStore } from "@/store/useResumeStore";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function PublicToggle() {
    const { activeResumeId, resumes, toggleResumeVisibility } = useResumeStore();
    const activeResume = activeResumeId ? resumes[activeResumeId] : null;

    if (!activeResume) return null;

    const isPublic = activeResume.isPublic || false;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border cursor-pointer hover:bg-muted transition-colors">
                        {isPublic ? (
                            <Eye className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                        ) : (
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="text-xs font-medium">
                            {isPublic ? "Public Template" : "Private"}
                        </span>
                        <Switch
                            checked={isPublic}
                            onCheckedChange={() => toggleResumeVisibility(activeResume.id)}
                            className="data-[state=checked]:bg-green-600"
                            aria-label="Toggle public/private resume visibility"
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-sm">
                        {isPublic ? (
                            <>
                                <strong>Public Template:</strong> This resume is visible on the main page
                                for others to use as a template (local browser only).
                            </>
                        ) : (
                            <>
                                <strong>Private Resume:</strong> Only you can see this resume.
                                Enable to share it as a public template.
                            </>
                        )}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
