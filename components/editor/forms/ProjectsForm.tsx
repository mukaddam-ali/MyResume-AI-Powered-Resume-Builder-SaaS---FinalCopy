"use client";
import React, { useState } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextarea } from "@/components/ui/rich-textarea";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
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
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="pl-10">
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <Label>Project Name</Label>
                                                <Input
                                                    value={proj.name}
                                                    onChange={(e) => updateProject(proj.id, { name: e.target.value })}
                                                    placeholder="E.g. E-commerce Platform"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Technologies</Label>
                                                <Input
                                                    value={proj.technologies}
                                                    onChange={(e) => updateProject(proj.id, { technologies: e.target.value })}
                                                    placeholder="React, Node.js, PostgreSQL"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label>Link (Optional)</Label>
                                                    <Input
                                                        value={proj.link}
                                                        onChange={(e) => updateProject(proj.id, { link: e.target.value })}
                                                        placeholder="e.g., github.com/username/project"
                                                        type="url"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Link Text (Optional)</Label>
                                                    <div className="relative flex items-center">
                                                        <Input
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
