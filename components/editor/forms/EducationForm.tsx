"use client";
import React from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

// Note: Shadcn checkbox needs clear installed. I didn't install it. Using standard input for simplicity.

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

export function EducationForm() {
    const activeResumeId = useResumeStore((state) => state.activeResumeId);
    const education = useResumeStore((state) => state.activeResumeId ? state.resumes[state.activeResumeId]?.education : []) || [];
    const addEducation = useResumeStore((state) => state.addEducation);
    const removeEducation = useResumeStore((state) => state.removeEducation);
    const updateEducation = useResumeStore((state) => state.updateEducation);
    const reorderItems = useResumeStore((state) => state.reorderItems);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = education.findIndex((item) => item.id === active.id);
            const newIndex = education.findIndex((item) => item.id === over.id);
            reorderItems("education", arrayMove(education, oldIndex, newIndex));
        }
    };

    const handleAdd = () => {
        addEducation({
            id: Math.random().toString(36).substring(2, 9),
            school: "",
            degree: "",
            startDate: "",
            endDate: "",
            current: false,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Education</h2>
                <Button onClick={handleAdd} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Add School
                </Button>
            </div>

            <SectionScaleControl sectionId="education" />

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={education.map((e) => e.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {education.map((edu) => (
                            <SortableItem key={edu.id} id={edu.id}>
                                <Card>
                                    <CardContent className="pt-6 pl-10 space-y-4 relative">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 text-destructive hover:text-destructive"
                                            onClick={() => removeEducation(edu.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>School</Label>
                                                <Input
                                                    value={edu.school}
                                                    onChange={(e) => updateEducation(edu.id, { school: e.target.value })}
                                                    placeholder="University of Texas"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Degree</Label>
                                                <Input
                                                    value={edu.degree}
                                                    onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                                                    placeholder="BS Computer Science"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Start Date</Label>
                                                <Input
                                                    value={edu.startDate}
                                                    onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })}
                                                    placeholder="Jun 2020"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>End Date</Label>
                                                <Input
                                                    value={edu.endDate}
                                                    onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
                                                    placeholder="May 2024"
                                                    disabled={edu.current}
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
