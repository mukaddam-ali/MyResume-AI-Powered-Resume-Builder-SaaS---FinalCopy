"use client";
import React, { useState } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextarea } from "@/components/ui/rich-textarea";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Settings } from "lucide-react";
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

interface CustomSectionFormProps {
    sectionId: string;
}

import { SectionScaleControl } from "../SectionScaleControl";

export function CustomSectionForm({ sectionId }: CustomSectionFormProps) {
    const activeResumeId = useResumeStore((state) => state.activeResumeId);
    const section = useResumeStore((state) =>
        state.activeResumeId
            ? state.resumes[state.activeResumeId]?.customSections?.find(s => s.id === sectionId)
            : undefined
    );
    const updateCustomSectionTitle = useResumeStore((state) => state.updateCustomSectionTitle);
    const addCustomItem = useResumeStore((state) => state.addCustomItem);
    const removeCustomItem = useResumeStore((state) => state.removeCustomItem);
    const updateCustomItem = useResumeStore((state) => state.updateCustomItem);
    const reorderCustomItems = useResumeStore((state) => state.reorderCustomItems);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (!activeResumeId || !section) return null;

    const items = section.items || [];

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = section.items.findIndex((item) => item.id === active.id);
            const newIndex = section.items.findIndex((item) => item.id === over.id);

            const newOrder = arrayMove(section.items, oldIndex, newIndex);
            reorderCustomItems(sectionId, newOrder);
        }
    };

    const handleAddItem = () => {
        addCustomItem(sectionId, {
            id: Date.now().toString(),
            name: '',
            description: '',
            date: '',
            city: ''
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor={`section-title-${section.id}`}>Section Title</Label>
                    <Input
                        id={`section-title-${section.id}`}
                        value={section.title}
                        onChange={(e) => updateCustomSectionTitle(section.id, e.target.value)}
                        placeholder="e.g. Volunteering, Publications"
                    />
                </div>
            </div>

            <SectionScaleControl sectionId={sectionId} />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Items</h3>
                    <Button onClick={handleAddItem} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                    </Button>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={section.items.map(item => item.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {section.items.map((item) => (
                            <SortableItem key={item.id} id={item.id}>
                                <Card>
                                    <CardContent className="pl-10 pt-6 relative">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => removeCustomItem(section.id, item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="grid gap-2 flex-1 mr-4">
                                                    <Label>Name / Title</Label>
                                                    <Input
                                                        value={item.name}
                                                        onChange={(e) => updateCustomItem(section.id, item.id, { name: e.target.value })}
                                                        placeholder="e.g. Volunteer at Animal Shelter"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label>Date / Duration</Label>
                                                    <Input
                                                        value={item.date}
                                                        onChange={(e) => updateCustomItem(section.id, item.id, { date: e.target.value })}
                                                        placeholder="e.g. 2020 - Present"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>City / Location (Optional)</Label>
                                                    <Input
                                                        value={item.city || ''}
                                                        onChange={(e) => updateCustomItem(section.id, item.id, { city: e.target.value })}
                                                        placeholder="e.g. Austin, TX"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label>Description</Label>
                                                <RichTextarea
                                                    value={item.description}
                                                    onValueChange={(value) => updateCustomItem(section.id, item.id, { description: value })}
                                                    placeholder="Describe your contribution..."
                                                    className="min-h-[100px]"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </SortableItem>
                        ))}
                    </SortableContext>
                </DndContext>

                {section.items.length === 0 && (
                    <div className="text-center p-8 border-2 border-dashed rounded-lg text-gray-500">
                        No items yet. Click "Add Item" to get started.
                    </div>
                )}
            </div>
        </div>
    );
};
