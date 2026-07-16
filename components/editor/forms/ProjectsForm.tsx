"use client";
import React, { useState } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextarea } from "@/components/ui/rich-textarea";
import { Loader2, Plus, Sparkles, Trash2, ImagePlus, X } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "../SortableItem";

import { SectionScaleControl } from "../SectionScaleControl";

/**
 * Compress an uploaded image to a small JPEG data URL (max 800px wide) so
 * project cards stay light enough to store inside the resume JSON.
 */
function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new window.Image();
            img.onload = () => {
                const maxW = 800;
                const scale = Math.min(1, maxW / img.width);
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas unavailable'));
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = () => reject(new Error('Invalid image'));
            img.src = reader.result as string;
        };
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
    });
}

const PROJECT_CATEGORIES = ["Full Stack", "Frontend", "Backend", "Mobile", "AI/ML", "Other"];

function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

function LinkColorPicker({
    initialColor,
    onChange,
}: {
    initialColor: string;
    onChange: (color: string) => void;
}) {
    const [color, setColor] = React.useState(initialColor);

    React.useEffect(() => {
        setColor(initialColor);
    }, [initialColor]);

    const debouncedOnChange = React.useMemo(() => {
        return debounce((nextColor: string) => {
            onChange(nextColor);
        }, 100);
    }, [onChange]);

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nextColor = e.target.value;
        setColor(nextColor);
        debouncedOnChange(nextColor);
    };

    return (
        <div
            className="absolute right-2 w-6 h-6 rounded-full border border-muted-foreground/30 shadow-sm flex items-center justify-center overflow-hidden animate-in fade-in"
            style={{ backgroundColor: color }}
        >
            <input
                type="color"
                value={color}
                onChange={handleColorChange}
                className="opacity-0 w-full h-full cursor-pointer absolute inset-0 text-[0px]"
                title="Choose link text color"
                aria-label="Choose link text color"
            />
        </div>
    );
}

export function ProjectsForm() {
    const activeResumeId = useResumeStore((state) => state.activeResumeId);
    const projects = useResumeStore((state) => state.activeResumeId ? state.resumes[state.activeResumeId]?.projects : undefined) || [];
    const addProject = useResumeStore((state) => state.addProject);
    const removeProject = useResumeStore((state) => state.removeProject);
    const updateProject = useResumeStore((state) => state.updateProject);
    const reorderItems = useResumeStore((state) => state.reorderItems);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (!activeResumeId) return null;

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = projects.findIndex((item) => item.id === active.id);
            const newIndex = projects.findIndex((item) => item.id === over.id);
            reorderItems("projects", arrayMove(projects, oldIndex, newIndex));
        }
    };

    const handleGenerateAI = async (id: string, name: string, technologies: string) => {
        if (!name) {
            alert("Please enter a Project Name first.");
            return;
        }

        setIsGenerating(id);
        try {
            const response = await fetch("/api/ai/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "project",
                    title: name,
                    context: technologies || "general software project"
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Generation failed");

            const currentProj = projects.find(p => p.id === id);
            const newDescription = currentProj?.description
                ? `${currentProj.description}\n\n${data.content}`
                : data.content;

            updateProject(id, { description: newDescription });

        } catch (error) {
            console.error("AI Generation failed:", error);
            alert("Failed to generate content. Please check your API key.");
        } finally {
            setIsGenerating(null);
        }
    };

    const handleAdd = () => {
        addProject({
            id: Date.now().toString(),
            name: "",
            description: "",
            technologies: "",
            link: ""
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Projects</h3>
                <Button onClick={handleAdd} size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Add Project
                </Button>
            </div>

            <SectionScaleControl sectionId="projects" />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={projects.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {projects.map((proj, index) => (
                            <SortableItem key={proj.id} id={proj.id}>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-10">
                                        <CardTitle className="text-sm font-medium">
                                            Project {index + 1}
                                        </CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeProject(proj.id)}
                                            className="text-destructive hover:bg-destructive/10"
                                            aria-label="Remove project entry"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="pl-10">
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor={`proj-name-${proj.id}`}>Project Name</Label>
                                                <Input
                                                    id={`proj-name-${proj.id}`}
                                                    value={proj.name}
                                                    onChange={(e) => updateProject(proj.id, { name: e.target.value })}
                                                    placeholder="E.g. E-commerce Platform"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor={`proj-tech-${proj.id}`}>Technologies/other</Label>
                                                <Input
                                                    id={`proj-tech-${proj.id}`}
                                                    value={proj.technologies}
                                                    onChange={(e) => updateProject(proj.id, { technologies: e.target.value })}
                                                    placeholder="React, Node.js, PostgreSQL"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor={`proj-link-${proj.id}`}>Link (Optional)</Label>
                                                    <Input
                                                        id={`proj-link-${proj.id}`}
                                                        value={proj.link}
                                                        onChange={(e) => updateProject(proj.id, { link: e.target.value })}
                                                        placeholder="e.g., github.com/username/project"
                                                        type="url"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor={`proj-linktext-${proj.id}`}>Link Text (Optional)</Label>
                                                    <div className="relative flex items-center">
                                                        <Input
                                                            id={`proj-linktext-${proj.id}`}
                                                            value={proj.linkText || ''}
                                                            onChange={(e) => updateProject(proj.id, { linkText: e.target.value })}
                                                            placeholder="e.g., View Project, GitHub"
                                                            className="pr-10"
                                                        />
                                                        <LinkColorPicker
                                                            initialColor={proj.linkColor || '#2563eb'}
                                                            onChange={(color) => updateProject(proj.id, { linkColor: color })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Portfolio card extras: image + category (used on the public portfolio page) */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor={`proj-image-${proj.id}`}>Card Image <span className="text-muted-foreground font-normal">(portfolio)</span></Label>
                                                    {proj.image ? (
                                                        <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={proj.image} alt={proj.name || 'Project image'} className="w-full h-full object-cover" />
                                                            <button
                                                                onClick={() => updateProject(proj.id, { image: undefined })}
                                                                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                                                                aria-label="Remove project image"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label
                                                            htmlFor={`proj-image-${proj.id}`}
                                                            className="flex items-center justify-center gap-2 w-full aspect-video rounded-md border-2 border-dashed text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
                                                        >
                                                            <ImagePlus className="h-4 w-4" /> Upload image
                                                        </label>
                                                    )}
                                                    <input
                                                        id={`proj-image-${proj.id}`}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            if (file.size > 8 * 1024 * 1024) { alert('Image too large (max 8 MB).'); return; }
                                                            try {
                                                                const dataUrl = await compressImage(file);
                                                                updateProject(proj.id, { image: dataUrl });
                                                            } catch {
                                                                alert('Could not process that image. Try a different file.');
                                                            }
                                                            e.target.value = '';
                                                        }}
                                                    />
                                                </div>
                                                <div className="grid gap-2 content-start">
                                                    <Label htmlFor={`proj-category-${proj.id}`}>Category <span className="text-muted-foreground font-normal">(portfolio filter)</span></Label>
                                                    <select
                                                        id={`proj-category-${proj.id}`}
                                                        value={proj.category || ''}
                                                        onChange={(e) => updateProject(proj.id, { category: e.target.value || undefined })}
                                                        className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                                    >
                                                        <option value="">None</option>
                                                        {PROJECT_CATEGORIES.map(c => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex justify-between items-center">
                                                    <Label htmlFor={`description-${proj.id}`}>Description</Label>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                        onClick={() => handleGenerateAI(proj.id, proj.name, proj.technologies)}
                                                        disabled={isGenerating === proj.id}
                                                    >
                                                        {isGenerating === proj.id ? (
                                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                        ) : (
                                                            <Sparkles className="h-3 w-3 mr-1" />
                                                        )}
                                                        {isGenerating === proj.id ? "Writing..." : "Auto-Write with AI"}
                                                    </Button>
                                                </div>
                                                <RichTextarea
                                                    id={`description-${proj.id}`}
                                                    value={proj.description}
                                                    onValueChange={(value) => updateProject(proj.id, { description: value })}
                                                    placeholder="Describe the project..."
                                                    className="min-h-[100px]"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </SortableItem>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
