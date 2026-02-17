"use client";

import Link from "next/link";

import { useMemo, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
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
import { Loader2, Check, Cloud, AlertCircle, GripVertical, LogIn, Trash2 } from "lucide-react";

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
    const { syncStatus, lastSyncError, resumes, activeResumeId, reorderSections, addCustomSection, removeSection, addSection, updateResumeName, renameSection } = useResumeStore();
    const activeResume = activeResumeId ? resumes[activeResumeId] : null;

    // Ensure we have a valid order, fallback to default if legacy resume
    const sectionOrder = useMemo(() => {
        return activeResume?.sectionOrder || ['personal', 'education', 'experience', 'projects', 'skills'];
    }, [activeResume?.sectionOrder]);

    // Calculate missing standard sections
    const standardSections = ['education', 'experience', 'projects', 'skills'];
    const missingSections = standardSections.filter(id => !(sectionOrder || []).includes(id));

    const customSections = activeResume?.customSections || [];

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
                {activeResume ? (
                    <div className="flex-1 mr-4">
                        <Input
                            value={activeResume.name}
                            onChange={(e) => updateResumeName(activeResume.id, e.target.value)}
                            className="bg-transparent border-transparent hover:border-input focus:border-input px-2 h-auto py-1 text-xl font-bold w-auto min-w-[150px] max-w-[300px]"
                            aria-label="Rename Resume"
                        />
                    </div>
                ) : (
                    <h1 className="text-2xl font-bold">Editor</h1>
                )}

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
                    <ResumeScore />
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ColorPicker />
                        <FontSelector />
                    </div>
                    <TemplateSelector />

                    <Tabs defaultValue="personal" className="w-full">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <TabsList className="flex flex-wrap h-auto gap-2 mb-4 bg-background p-2 w-full justify-start">
                                <SortableContext
                                    items={sectionOrder}
                                    strategy={rectSortingStrategy}
                                >
                                    {sectionOrder.map((sectionId) => {
                                        // Allow deleting everything except Personal Info
                                        const canDelete = sectionId !== 'personal';
                                        return (
                                            <div key={sectionId} className="min-w-[120px]">
                                                <SortableTabTrigger
                                                    id={sectionId}
                                                    value={sectionId}
                                                    label={getSectionLabel(sectionId, customSections, activeResume?.sectionTitles)}
                                                    onDelete={canDelete ? () => removeSection(sectionId) : undefined}
                                                    onRename={(newTitle) => renameSection(sectionId, newTitle)}
                                                />
                                            </div>
                                        );
                                    })}
                                </SortableContext>

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
                                                        <span className="capitalize">{getSectionLabel(sectionId, [], activeResume?.sectionTitles)}</span>
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
                            </TabsList>
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
