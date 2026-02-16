"use client";

import React from "react";
import { useResumeStore } from "@/store/useResumeStore";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Layout, FileText, Code, PenTool, Palette, Sparkles, Crown, Trash2, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UpgradeButton from "@/components/payment/UpgradeButton";

import { cn } from "@/lib/utils";


export function TemplateSelector() {
    const { resumes, activeResumeId, setTemplate, loadExampleData, resetResume, userTier, setBrandingEnabled } = useResumeStore();
    const activeResume = activeResumeId ? resumes[activeResumeId] : null;
    const selectedTemplate = activeResume?.selectedTemplate || 'classic';
    const isBrandingEnabled = activeResume?.isBrandingEnabled ?? true;
    const [showTemplateUpgrade, setShowTemplateUpgrade] = React.useState(false);
    const [showBrandingUpgrade, setShowBrandingUpgrade] = React.useState(false);

    const templates = [
        { id: 'classic', name: 'Classic', icon: FileText, premium: false, comingSoon: false },
        { id: 'modern', name: 'Modern', icon: Layout, premium: false, comingSoon: false },
        { id: 'minimalist', name: 'Minimal', icon: PenTool, premium: false, comingSoon: false },
        // GitHub template removed
        { id: 'creative', name: 'Creative', icon: Palette, premium: true, comingSoon: false },
        { id: 'corporate', name: 'Corporate Blue', icon: Sparkles, premium: true, comingSoon: true },
        { id: 'executive', name: 'Executive', icon: Crown, premium: true, comingSoon: true },
        { id: 'designer', name: 'Designer', icon: Palette, premium: true, comingSoon: true },
    ] as const;


    const handleTemplateChange = (value: string) => {
        const template = templates.find(t => t.id === value);

        if (template?.comingSoon) return; // Prevent selection of coming soon templates

        if (template?.premium && userTier === 'free') {
            setShowTemplateUpgrade(true);
            return;
        }
        setTemplate(value as any);
    };


    return (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Select
                value={selectedTemplate}
                onValueChange={handleTemplateChange}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue>
                        {(() => {
                            const selected = templates.find(t => t.id === selectedTemplate);
                            if (!selected) return "Select Template";
                            return (
                                <span className="flex items-center gap-2">
                                    <selected.icon className="w-4 h-4" />
                                    {selected.name}
                                </span>
                            );
                        })()}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {templates.map(t => (
                        <SelectItem
                            key={t.id}
                            value={t.id}
                            disabled={(t.premium && userTier === 'free') || t.comingSoon}
                            className="justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <t.icon className="w-4 h-4" />
                                {t.name}
                            </span>
                            {t.comingSoon ? (
                                <span className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded ml-2">Coming Soon</span>
                            ) : (
                                t.premium && <Crown className="w-3 h-3 text-yellow-500 ml-2 inline" />
                            )}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Branding Toggle (Pro Feature) */}
            <div className="ml-4 flex items-center gap-2">
                <Switch
                    checked={!isBrandingEnabled}
                    onCheckedChange={(checked) => {
                        if (userTier === 'free' && checked) {
                            setShowBrandingUpgrade(true);
                            return;
                        }
                        setBrandingEnabled(!checked);
                    }}
                    disabled={userTier === 'free'}
                    className={userTier === 'free' ? 'opacity-50 cursor-not-allowed' : ''}
                />
                <Label className="text-sm text-muted-foreground flex items-center gap-1">
                    Remove Branding
                    {userTier === 'free' && <Crown className="w-3 h-3 text-yellow-500" />}
                </Label>
            </div>

            <div className="ml-auto flex gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        if (activeResumeId && confirm("Are you sure you want to clear all resume data? This action cannot be undone.")) {
                            resetResume(activeResumeId);
                        }
                    }}
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Clear All Data"
                >
                    <Trash2 className="h-4 w-4" />
                    Clear All
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={loadExampleData}
                    className="gap-2"
                    title="Load Example Data"
                >
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Auto-Fill
                </Button>
            </div>

            {/* Template Upgrade Dialog */}
            <Dialog open={showTemplateUpgrade} onOpenChange={setShowTemplateUpgrade}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-yellow-500" />
                            Premium Template
                        </DialogTitle>
                        <DialogDescription>
                            This is a premium template. Upgrade to Pro to unlock all premium templates and features.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 pt-4">
                        <UpgradeButton fullWidth />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Branding Removal Upgrade Dialog */}
            <Dialog open={showBrandingUpgrade} onOpenChange={setShowBrandingUpgrade}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-yellow-500" />
                            Remove Branding - Pro Feature
                        </DialogTitle>
                        <DialogDescription>
                            Remove "Powered by MyResume" branding from your resume. Upgrade to Pro to unlock this feature.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 pt-4">
                        <UpgradeButton fullWidth />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
