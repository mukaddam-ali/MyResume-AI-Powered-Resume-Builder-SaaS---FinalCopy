"use client";

import { useState } from "react";
import { useResumeStore, ResumeVariant } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Plus, Trash2, Check, ChevronDown, ChevronUp,
    GitBranch, Eye, EyeOff, Pencil, X
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function VariantManager() {
    const activeResumeId = useResumeStore(s => s.activeResumeId);
    const resume = useResumeStore(s => s.activeResumeId ? s.resumes[s.activeResumeId] : null);
    const addVariant = useResumeStore(s => s.addVariant);
    const removeVariant = useResumeStore(s => s.removeVariant);
    const setActiveVariant = useResumeStore(s => s.setActiveVariant);
    const toggleVariantItemVisibility = useResumeStore(s => s.toggleVariantItemVisibility);
    const renameVariant = useResumeStore(s => s.renameVariant);

    const [isExpanded, setIsExpanded] = useState(false);
    const [newVariantName, setNewVariantName] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    if (!resume || !activeResumeId) return null;

    const variants = resume.variants || [];
    const activeVariantId = resume.activeVariantId ?? null;
    const activeVariant = variants.find(v => v.id === activeVariantId) ?? null;

    const handleAdd = () => {
        if (!newVariantName.trim()) return;
        addVariant(activeResumeId, newVariantName.trim());
        setNewVariantName("");
        setIsAdding(false);
    };

    const handleRename = (variantId: string) => {
        if (!editName.trim()) return;
        renameVariant(activeResumeId, variantId, editName.trim());
        setEditingId(null);
    };

    const isSectionHidden = (section: 'experience' | 'education' | 'projects' | 'skills', itemId: string) => {
        return activeVariant?.hiddenItems[section]?.includes(itemId) ?? false;
    };

    const toggleItem = (section: 'experience' | 'education' | 'projects' | 'skills', itemId: string) => {
        if (!activeVariantId) return;
        toggleVariantItemVisibility(activeResumeId, activeVariantId, section, itemId);
    };

    return (
        <TooltipProvider>
            <div className="border rounded-xl overflow-hidden bg-muted/20">
                {/* Header */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                    aria-expanded={isExpanded}
                >
                    <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-violet-500" />
                        <span className="text-sm font-semibold">Resume Variants</span>
                        {variants.length > 0 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                                {variants.length}
                            </Badge>
                        )}
                        {activeVariantId && (
                            <Badge className="text-xs px-1.5 py-0 h-4 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-0">
                                {activeVariant?.name}
                            </Badge>
                        )}
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                    <div className="px-4 pb-4 space-y-4">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Create targeted versions of your resume. In a variant, toggle which items to hide for that specific job application.
                        </p>

                        {/* Variant Switcher */}
                        <div className="space-y-1.5">
                            {/* Master mode */}
                            <button
                                onClick={() => setActiveVariant(activeResumeId, null)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                    !activeVariantId
                                        ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium"
                                        : "hover:bg-muted/60 text-muted-foreground"
                                }`}
                            >
                                <Check className={`w-3.5 h-3.5 ${!activeVariantId ? "opacity-100" : "opacity-0"}`} />
                                Master (all items visible)
                            </button>

                            {/* Variant list */}
                            {variants.map((variant) => (
                                <div
                                    key={variant.id}
                                    className={`flex items-center gap-1 rounded-lg transition-colors ${
                                        activeVariantId === variant.id
                                            ? "bg-violet-100 dark:bg-violet-900/30"
                                            : "hover:bg-muted/40"
                                    }`}
                                >
                                    {editingId === variant.id ? (
                                        <div className="flex-1 flex items-center gap-1 px-2 py-1">
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") handleRename(variant.id); if (e.key === "Escape") setEditingId(null); }}
                                                className="h-6 text-xs px-2"
                                                autoFocus
                                            />
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRename(variant.id)}>
                                                <Check className="w-3 h-3 text-green-600" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingId(null)}>
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setActiveVariant(activeResumeId, variant.id)}
                                                className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-left"
                                            >
                                                <Check className={`w-3.5 h-3.5 ${activeVariantId === variant.id ? "opacity-100 text-violet-600" : "opacity-0"}`} />
                                                <span className={activeVariantId === variant.id ? "text-violet-700 dark:text-violet-300 font-medium" : "text-muted-foreground"}>
                                                    {variant.name}
                                                </span>
                                                {(() => {
                                                    const totalHidden = (variant.hiddenItems.experience?.length || 0) +
                                                        (variant.hiddenItems.education?.length || 0) +
                                                        (variant.hiddenItems.projects?.length || 0) +
                                                        (variant.hiddenItems.skills?.length || 0);
                                                    return totalHidden > 0 ? (
                                                        <span className="text-xs text-muted-foreground/60">
                                                            ({totalHidden} hidden)
                                                        </span>
                                                    ) : null;
                                                })()}
                                            </button>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 shrink-0 mr-0.5"
                                                        onClick={() => { setEditingId(variant.id); setEditName(variant.name); }}
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Rename variant</TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 shrink-0 mr-1 text-destructive hover:text-destructive"
                                                        onClick={() => removeVariant(activeResumeId, variant.id)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Delete variant</TooltipContent>
                                            </Tooltip>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add Variant */}
                        {isAdding ? (
                            <div className="flex gap-2">
                                <Input
                                    value={newVariantName}
                                    onChange={(e) => setNewVariantName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setIsAdding(false); }}
                                    placeholder="e.g. Frontend Dev, PM Role"
                                    className="h-8 text-sm"
                                    autoFocus
                                />
                                <Button size="sm" onClick={handleAdd} className="h-8 px-3 shrink-0 bg-violet-600 hover:bg-violet-700">
                                    <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-8 px-3 shrink-0">
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAdding(true)}
                                className="w-full gap-1.5 text-xs border-dashed border-violet-300 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Create New Variant
                            </Button>
                        )}

                        {/* Item visibility panel — only shown when a variant is active */}
                        {activeVariantId && activeVariant && (
                            <div className="mt-2 space-y-3 border-t pt-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    Visibility in "{activeVariant.name}"
                                </p>

                                {/* Experience items */}
                                {resume.experience && resume.experience.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Experience</p>
                                        {resume.experience.map(exp => {
                                            const hidden = isSectionHidden('experience', exp.id);
                                            return (
                                                <button
                                                    key={exp.id}
                                                    onClick={() => toggleItem('experience', exp.id)}
                                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                                                        hidden
                                                            ? "bg-muted/30 text-muted-foreground/50 line-through"
                                                            : "bg-green-50 dark:bg-green-950/20 text-foreground"
                                                    }`}
                                                >
                                                    {hidden
                                                        ? <EyeOff className="w-3 h-3 shrink-0 text-muted-foreground/50" />
                                                        : <Eye className="w-3 h-3 shrink-0 text-green-600" />
                                                    }
                                                    <span className="truncate">{exp.role} @ {exp.company}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Education items */}
                                {resume.education && resume.education.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Education</p>
                                        {resume.education.map(edu => {
                                            const hidden = isSectionHidden('education', edu.id);
                                            return (
                                                <button
                                                    key={edu.id}
                                                    onClick={() => toggleItem('education', edu.id)}
                                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                                                        hidden
                                                            ? "bg-muted/30 text-muted-foreground/50 line-through"
                                                            : "bg-green-50 dark:bg-green-950/20 text-foreground"
                                                    }`}
                                                >
                                                    {hidden
                                                        ? <EyeOff className="w-3 h-3 shrink-0 text-muted-foreground/50" />
                                                        : <Eye className="w-3 h-3 shrink-0 text-green-600" />
                                                    }
                                                    <span className="truncate">{edu.school} — {edu.degree}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Project items */}
                                {resume.projects && resume.projects.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Projects</p>
                                        {resume.projects.map(proj => {
                                            const hidden = isSectionHidden('projects', proj.id);
                                            return (
                                                <button
                                                    key={proj.id}
                                                    onClick={() => toggleItem('projects', proj.id)}
                                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                                                        hidden
                                                            ? "bg-muted/30 text-muted-foreground/50 line-through"
                                                            : "bg-green-50 dark:bg-green-950/20 text-foreground"
                                                    }`}
                                                >
                                                    {hidden
                                                        ? <EyeOff className="w-3 h-3 shrink-0 text-muted-foreground/50" />
                                                        : <Eye className="w-3 h-3 shrink-0 text-green-600" />
                                                    }
                                                    <span className="truncate">{proj.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Skills */}
                                {resume.skills && resume.skills.length > 0 && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Skills</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {resume.skills.map(skill => {
                                                const hidden = isSectionHidden('skills', skill);
                                                return (
                                                    <button
                                                        key={skill}
                                                        onClick={() => toggleItem('skills', skill)}
                                                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                                                            hidden
                                                                ? "bg-muted/30 text-muted-foreground/40 line-through"
                                                                : "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                                                        }`}
                                                    >
                                                        {skill}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
