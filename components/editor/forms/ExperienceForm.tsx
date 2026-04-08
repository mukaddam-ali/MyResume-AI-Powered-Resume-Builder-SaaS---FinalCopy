"use client";
import React, { useState } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextarea } from '@/components/ui/rich-textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export function ExperienceForm() {
    const activeResumeId = useResumeStore((state) => state.activeResumeId);
    const experience = useResumeStore((state) => state.activeResumeId ? state.resumes[state.activeResumeId]?.experience : undefined) || [];
    const addExperience = useResumeStore((state) => state.addExperience);
    const removeExperience = useResumeStore((state) => state.removeExperience);
    const updateExperience = useResumeStore((state) => state.updateExperience);
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
            const oldIndex = experience.findIndex((item) => item.id === active.id);
            const newIndex = experience.findIndex((item) => item.id === over.id);
            reorderItems("experience", arrayMove(experience, oldIndex, newIndex));
        }
    };

    const handleGenerateAI = async (id: string, role: string, company: string) => {
        if (!role || !company) {
            alert("Please enter a Role and Company first.");
            return;
        }

        setIsGenerating(id);
        try {
            const response = await fetch("/api/ai/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "experience",
                    title: role,
                    context: company
                }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Generation failed");

            // Append the generated content
            const currentExp = experience.find(e => e.id === id);
            const newDescription = currentExp?.description
                ? `${currentExp.description}\n\n${data.content}`
                : data.content;

            updateExperience(id, { description: newDescription });

        } catch (error) {
            console.error("AI Generation failed:", error);
            alert("Failed to generate content. Please check your API key.");
        } finally {
            setIsGenerating(null);
        }
    };

    const handleAdd = () => {
        addExperience({
            id: Math.random().toString(36).substring(2, 9),
            company: "",
            role: "",
            startDate: "",
            endDate: "",
            current: false,
            description: "",
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Experience</h2>
                <Button onClick={handleAdd} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Experience
                </Button>
            </div>

            <SectionScaleControl sectionId="experience" />



            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={experience.map((e) => e.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {experience.map((exp) => (
                            <SortableItem key={exp.id} id={exp.id}>
                                <Card>
                                    <CardContent className="pt-6 pl-10 space-y-4 relative"> {/* Added pl-10 for handle space */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 text-destructive hover:text-destructive"
                                            onClick={() => removeExperience(exp.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Company</Label>
                                                <Input
                                                    value={exp.company}
                                                    onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                                                    placeholder="Tech Corp"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Role</Label>
                                                <Input
                                                    value={exp.role}
                                                    onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                                                    placeholder="Software Engineer Intern"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Start Date</Label>
                                                <Input
                                                    value={exp.startDate}
                                                    onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                                                    placeholder="Jun 2023"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>End Date</Label>
                                                <Input
                                                    value={exp.endDate}
                                                    onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                                                    placeholder="Aug 2023"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <div className="grid gap-2">
                                                    <div className="flex justify-between items-center">
                                                        <Label htmlFor={`description-${exp.id}`}>Description</Label>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                            onClick={() => handleGenerateAI(exp.id, exp.role, exp.company)}
                                                            disabled={isGenerating === exp.id}
                                                        >
                                                            {isGenerating === exp.id ? (
                                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                            ) : (
                                                                <Sparkles className="h-3 w-3 mr-1" />
                                                            )}
                                                            {isGenerating === exp.id ? "Writing..." : "Auto-Write with AI"}
                                                        </Button>
                                                    </div>
                                                    <RichTextarea // Replaced Textarea with RichTextarea
                                                        id={`description-${exp.id}`}
                                                        value={exp.description}
                                                        onValueChange={(value) => updateExperience(exp.id, { description: value })} // Changed onChange to onValueChange
                                                        placeholder="Describe your responsibilities and achievements..."
                                                        className="min-h-[100px]"
                                                    />
                                                </div>
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
