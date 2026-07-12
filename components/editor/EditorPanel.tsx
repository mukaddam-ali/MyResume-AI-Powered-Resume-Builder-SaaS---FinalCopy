"use client";

import Link from "next/link";

import { useMemo, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PersonalInfoForm } from "./forms/PersonalInfoForm";
import { EducationForm } from "./forms/EducationForm";
import { ExperienceForm } from "./forms/ExperienceForm";
import { ProjectsForm } from "./forms/ProjectsForm";
import { SkillsForm } from "./forms/SkillsForm";

import { ColorPicker } from "./ColorPicker";
import { FontSelector } from "./FontSelector";
import { ResumeScore } from "./ResumeScore";
import { TemplateSelector } from "./TemplateSelector";


import { useResumeStore } from "@/store/useResumeStore";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Check, Cloud, AlertCircle, GripVertical, LogIn, Trash2, ArrowLeft } from "lucide-react";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { CustomSectionForm } from "./forms/CustomSectionForm";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicToggle } from "./PublicToggle";
import { VariantManager } from "./VariantManager";
import { CoverLetterGenerator } from "./CoverLetterGenerator";

// Update SECTION_LABELS to be a helper function or fallback
const getSectionLabel = (id: string, customSections: any[], sectionTitles: Record<string, string> = {}) => {
    if (sectionTitles[id]) return sectionTitles[id];
    const fixedLabels: Record<string, string> = {
        personal: 'Personal',
        education: 'Education',
        experience: 'Professional Experience',
        projects: 'Projects',
        skills: 'Skills',
    };
    if (fixedLabels[id]) return fixedLabels[id];
    const custom = customSections?.find(s => s.id === id);
    return custom ? custom.title : id;
};

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function SortableTabTrigger({ id, value, label, onDelete, onRename }: { id: string, value: string, label: string, onDelete?: () => void, onRename?: (val: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(label);

    useEffect(() => {
        setEditValue(label);
    }, [label]);

    if (isEditing) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="relative w-full h-full flex items-center justify-center p-1"
            >
                <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    onBlur={() => {
                        setIsEditing(false);
                        if (editValue.trim()) onRename?.(editValue);
                        else setEditValue(label);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setIsEditing(false);
                            if (editValue.trim()) onRename?.(editValue);
                        } else if (e.key === 'Escape') {
                            setIsEditing(false);
                            setEditValue(label);
                        }
                    }}
                    className="h-8 text-center px-1 text-xs"
                    onPointerDown={(e) => e.stopPropagation()}
                />
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`relative group w-full h-full flex items-center justify-center ${isDragging ? 'opacity-50' : ''}`}
            onDoubleClick={() => {
                if (onRename) setIsEditing(true);
            }}
            title="Double-click to rename"
            role="presentation"
        >
            <TabsTrigger
                value={value}
                className="w-full h-full relative data-[state=active]:bg-background dark:data-[state=active]:text-foreground"
            >
                <GripVertical className="w-3 h-3 mr-1 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity absolute left-1" />
                <span className="truncate w-full text-center px-4">{label}</span>
            </TabsTrigger>

            {onDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                            className="absolute right-1 p-1 rounded-sm hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all z-10"
                            title="Delete Section"
                            aria-label={`Delete ${label} section`}
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. All data in this section will be lost.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                variant="default"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
}

export function EditorPanel() {
    const { user } = useAuth();
    const activeResumeId = useResumeStore(state => state.activeResumeId);
    const syncStatus = useResumeStore(state => state.syncStatus);
    const lastSyncError = useResumeStore(state => state.lastSyncError);

    // Granular resume specific slices
    const activeResumeName = useResumeStore(state => state.activeResumeId ? state.resumes[state.activeResumeId]?.name : '');
    const sectionOrder = useResumeStore(state => state.activeResumeId ? state.resumes[state.activeResumeId]?.sectionOrder : undefined) || ['personal', 'education', 'experience', 'projects', 'skills'];
    const customSections = useResumeStore(state => state.activeResumeId ? state.resumes[state.activeResumeId]?.customSections : undefined) || [];
    const sectionTitles = useResumeStore(state => state.activeResumeId ? state.resumes[state.activeResumeId]?.sectionTitles : undefined) || {};

    // Actions
    const reorderSections = useResumeStore(state => state.reorderSections);
    const addCustomSection = useResumeStore(state => state.addCustomSection);
    const removeSection = useResumeStore(state => state.removeSection);
    const addSection = useResumeStore(state => state.addSection);
    const updateResumeName = useResumeStore(state => state.updateResumeName);
    const renameSection = useResumeStore(state => state.renameSection);
    const contentScale = useResumeStore(state => state.activeResumeId ? state.resumes[state.activeResumeId]?.contentScale : undefined) || 1;
    const sectionSpacing = useResumeStore(state => state.activeResumeId ? state.resumes[state.activeResumeId]?.sectionSpacing : undefined) ?? 1;
    const setContentScale = useResumeStore(state => state.setContentScale);
    const setSectionSpacing = useResumeStore(state => state.setSectionSpacing);
    const userTier = useResumeStore(state => state.userTier);
    const hideBranding = useResumeStore(state => state.activeResumeId ? state.resumes[state.activeResumeId]?.hideBranding : false) ?? false;
    const setHideBranding = useResumeStore(state => state.setHideBranding);

    // Calculate missing standard sections
    const standardSections = ['education', 'experience', 'projects', 'skills'];
    const missingSections = standardSections.filter(id => !(sectionOrder || []).includes(id));

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const [isMounted, setIsMounted] = useState(false);
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = sectionOrder.indexOf(active.id as string);
            const newIndex = sectionOrder.indexOf(over.id as string);
            reorderSections(arrayMove(sectionOrder, oldIndex, newIndex));
        }
    };

    if (!isMounted) return null;

    return (
        <div className="flex flex-col bg-background border-r min-h-full">
            <div className="py-4 px-3 border-b flex justify-between items-center gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Link href="/dashboard" className="p-2 hover:bg-muted rounded-full transition-colors flex items-center justify-center shrink-0" title="Back to Dashboard">
                        <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    </Link>
                    {activeResumeId ? (
                        <div className="flex-1 min-w-0">
                            <Input
                                value={activeResumeName}
                                onChange={(e) => updateResumeName(activeResumeId, e.target.value)}
                                className="bg-transparent border-transparent hover:border-input focus:border-input px-2 h-auto py-1 text-xl font-bold w-full max-w-[300px]"
                                aria-label="Rename Resume"
                            />
                        </div>
                    ) : (
                        <h1 className="text-2xl font-bold truncate">Editor</h1>
                    )}
                </div>

                <PublicToggle />

                <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-xs font-medium cursor-help shrink-0"
                    title={
                        !user ? "Log in to save your changes to the cloud" :
                            syncStatus === 'error' ? lastSyncError || 'Sync Error' :
                                syncStatus === 'idle' ? 'Changes saved to local storage' :
                                    'Resume is auto-saved to cloud'
                    }
                >
                    {!user ? (
                        <Link href="/auth/login" className="flex items-center gap-2 text-amber-600 hover:text-amber-700 transition-colors">
                            <LogIn className="h-3.5 w-3.5" />
                            <span>Log in to sync</span>
                        </Link>
                    ) : (
                        <>
                            {syncStatus === 'syncing' && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                            {syncStatus === 'synced' && <Check className="h-3.5 w-3.5 text-green-500" />}
                            {syncStatus === 'error' && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                            {syncStatus === 'idle' && <Cloud className="h-3.5 w-3.5 text-muted-foreground" />}

                            <span className={
                                syncStatus === 'error' ? 'text-red-500' :
                                    syncStatus === 'synced' ? 'text-green-500' : ''
                            }>
                                {syncStatus === 'idle' ? 'Saved locally' :
                                    syncStatus === 'syncing' ? 'Syncing...' :
                                        syncStatus === 'synced' ? 'Auto Saved' : 'Sync Error'}
                            </span>
                        </>
                    )}
                </div>
            </div>
            <div className="flex-1">
                <div className="py-6 px-3 overflow-x-hidden max-w-full">
                    <div className="mb-4 flex justify-end">
                        <CoverLetterGenerator />
                    </div>
                    <ResumeScore />

                    {/* Scale Controls */}
                    <div className="mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">General Scale</span>
                                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                                        {Math.round(contentScale * 100)}%
                                    </span>
                                </div>
                                <Slider
                                    value={[contentScale]}
                                    onValueChange={(vals) => setContentScale(vals[0])}
                                    min={0.6}
                                    max={1.4}
                                    step={0.02}
                                    aria-label="General content scale"
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Section Space</span>
                                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                                        {Math.round(sectionSpacing * 100)}%
                                    </span>
                                </div>
                                <Slider
                                    value={[sectionSpacing]}
                                    onValueChange={(vals) => setSectionSpacing(vals[0])}
                                    min={0.2}
                                    max={2.0}
                                    step={0.1}
                                    aria-label="Section spacing scale"
                                />
                            </div>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-800/80 pt-3 flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                Remove Branding
                                {userTier !== 'pro' && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase text-white bg-gradient-to-r from-amber-500 to-orange-500">
                                        PRO
                                    </span>
                                )}
                            </span>
                            <button
                                id="branding-toggle"
                                role="switch"
                                aria-checked={userTier === 'pro' && hideBranding}
                                aria-label="Remove branding toggle"
                                disabled={userTier !== 'pro'}
                                onClick={() => userTier === 'pro' && setHideBranding(!hideBranding)}
                                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                                    userTier !== 'pro'
                                        ? 'cursor-not-allowed opacity-40 bg-muted'
                                        : hideBranding
                                            ? 'bg-emerald-500'
                                            : 'bg-input'
                                }`}
                            >
                                <span className={`pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                                    userTier === 'pro' && hideBranding ? 'translate-x-4' : 'translate-x-0.5'
                                }`} />
                            </button>
                        </div>
                    </div>

                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ColorPicker />
                        <FontSelector />
                    </div>

                    <TemplateSelector />

                    {/* Variant Manager */}
                    <div className="mb-6">
                        <VariantManager />
                    </div>

                    <Tabs defaultValue="personal" className="w-full">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="flex flex-wrap h-auto gap-2 mb-4 bg-background p-2 w-full justify-start">
                                <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 justify-start border-none shadow-none">
                                    <SortableContext
                                        items={sectionOrder}
                                        strategy={rectSortingStrategy}
                                    >
                                        {sectionOrder.map((sectionId) => {
                                            // Allow deleting everything except Personal Info
                                            const canDelete = sectionId !== 'personal';
                                            return (
                                                <div key={sectionId} className="min-w-[120px]" role="presentation">
                                                    <SortableTabTrigger
                                                        id={sectionId}
                                                        value={sectionId}
                                                        label={getSectionLabel(sectionId, customSections, sectionTitles)}
                                                        onDelete={canDelete ? () => removeSection(sectionId) : undefined}
                                                        onRename={(newTitle) => renameSection(sectionId, newTitle)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </SortableContext>
                                </TabsList>

                                {/* Inline Add Section Input */}
                                {isAddingSection && (
                                    <div className="min-w-[120px]">
                                        <div className="relative group w-full h-full flex items-center justify-center p-1">
                                            <Input
                                                value={newSectionName}
                                                onChange={(e) => setNewSectionName(e.target.value)}
                                                placeholder="Section name..."
                                                autoFocus
                                                onBlur={() => {
                                                    if (newSectionName.trim()) {
                                                        addCustomSection(newSectionName.trim());
                                                    }
                                                    setIsAddingSection(false);
                                                    setNewSectionName('');
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && newSectionName.trim()) {
                                                        addCustomSection(newSectionName.trim());
                                                        setIsAddingSection(false);
                                                        setNewSectionName('');
                                                    } else if (e.key === 'Escape') {
                                                        setIsAddingSection(false);
                                                        setNewSectionName('');
                                                    }
                                                }}
                                                className="h-8 text-center px-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Add Section Button */}
                                {!isAddingSection && (
                                    <div className="min-w-[120px]">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full h-8 gap-1 border-dashed text-xs"
                                                    aria-label="Add Section"
                                                >
                                                    <Plus className="h-3 w-3" /> Add
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="center" className="w-[200px]">
                                                <DropdownMenuLabel>Add to Resume</DropdownMenuLabel>
                                                <DropdownMenuSeparator />

                                                {/* Standard Sections */}
                                                {missingSections.map(sectionId => (
                                                    <DropdownMenuItem
                                                        key={sectionId}
                                                        onClick={() => addSection(sectionId)}
                                                    >
                                                        <span className="capitalize">{getSectionLabel(sectionId, [], sectionTitles)}</span>
                                                    </DropdownMenuItem>
                                                ))}

                                                {missingSections.length > 0 && <DropdownMenuSeparator />}

                                                {/* Custom Section */}
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setIsAddingSection(true);
                                                    }}
                                                >
                                                    <span>Custom Section...</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}
                            </div>
                        </DndContext>

                        {/* Content sections */}
                        <TabsContent value="personal"><PersonalInfoForm /></TabsContent>
                        <TabsContent value="education"><EducationForm /></TabsContent>
                        <TabsContent value="experience"><ExperienceForm /></TabsContent>
                        <TabsContent value="projects"><ProjectsForm /></TabsContent>
                        <TabsContent value="skills"><SkillsForm /></TabsContent>

                        {customSections.map(section => (
                            <TabsContent key={section.id} value={section.id}>
                                <CustomSectionForm sectionId={section.id} />
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
