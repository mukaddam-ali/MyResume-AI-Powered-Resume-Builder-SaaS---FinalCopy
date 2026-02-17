"use client";
import React, { useState, useRef, useEffect } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Plus, GripHorizontal } from "lucide-react";
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
    rectSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const POPULAR_SKILLS = [
    "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "C#",
    "HTML", "CSS", "SQL", "MongoDB", "PostgreSQL", "MySQL", "Git", "Docker",
    "Kubernetes", "AWS", "Azure", "GCP", "Angular", "Vue.js", "Next.js", "Express.js",
    "Django", "Flask", "Spring Boot", "REST API", "GraphQL", "Redis", "Agile",
    "Scrum", "CI/CD", "Jenkins", "Linux", "Bash", "PowerShell", "TensorFlow",
    "PyTorch", "Machine Learning", "Deep Learning", "Data Analysis", "Pandas",
    "NumPy", "R", "Tableau", "Power BI", "Excel", "Figma", "Adobe XD", "Photoshop"
];

function SortableSkillBadge({ skill, onRemove }: { skill: string, onRemove: (s: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: skill });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Badge variant="secondary" className="pl-3 pr-1 py-1.5 gap-1 cursor-grab active:cursor-grabbing hover:bg-secondary/80">
                {skill}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 hover:bg-destructive/20 rounded-full ml-1"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent drag start when clicking remove
                        onRemove(skill);
                    }}
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            onRemove(skill);
                        }
                    }}
                >
                    <X className="h-3 w-3" />
                </Button>
            </Badge>
        </div>
    );
}

import { SectionScaleControl } from "../SectionScaleControl";

export function SkillsForm() {
    const { resumes, activeResumeId, setSkills } = useResumeStore();
    const activeResume = activeResumeId ? resumes[activeResumeId] : null;
    const [searchText, setSearchText] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (!activeResume) return null;

    const selectedSkills = Array.isArray(activeResume.skills)
        ? activeResume.skills
        : typeof activeResume.skills === 'string'
            ? (activeResume.skills as string).split(',').map(s => s.trim()).filter(Boolean)
            : [];

    // Filter out duplicates for display logic only
    const uniqueSelectedSkills = Array.from(new Set(selectedSkills));

    const filteredSkills = POPULAR_SKILLS.filter(
        skill =>
            skill.toLowerCase().includes(searchText.toLowerCase()) &&
            !uniqueSelectedSkills.includes(skill)
    );

    const addSkill = (skill: string) => {
        const trimmedSkill = skill.trim();
        if (trimmedSkill && !uniqueSelectedSkills.includes(trimmedSkill)) {
            const newSkills = [...uniqueSelectedSkills, trimmedSkill];
            setSkills(newSkills);
            setSearchText("");
            setShowDropdown(false);
        }
    };

    const removeSkill = (skillToRemove: string) => {
        const newSkills = uniqueSelectedSkills
            .filter(skill => skill !== skillToRemove);
        setSkills(newSkills);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = uniqueSelectedSkills.indexOf(active.id as string);
            const newIndex = uniqueSelectedSkills.indexOf(over.id as string);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(uniqueSelectedSkills, oldIndex, newIndex);
                setSkills(newOrder);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchText.trim()) {
            e.preventDefault();
            const skillToAdd = filteredSkills.length > 0 ? filteredSkills[0] : searchText;
            addSkill(skillToAdd);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Skills</h3>
            <SectionScaleControl sectionId="skills" />

            {/* Skill Input with Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <Label htmlFor="skill-input">Add Skills</Label>
                <div className="relative mt-2">
                    <Input
                        id="skill-input"
                        value={searchText}
                        onChange={(e) => {
                            setSearchText(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type to search or add custom skill..."
                        className="pr-10"
                    />
                    {searchText && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => addSkill(searchText)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Dropdown */}
                {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {searchText && !POPULAR_SKILLS.some(s => s.toLowerCase() === searchText.toLowerCase()) && (
                            <button
                                onClick={() => addSkill(searchText)}
                                className="w-full px-4 py-2 text-left hover:bg-muted text-sm border-b flex items-center gap-2"
                            >
                                <Plus className="h-3 w-3" />
                                Add "{searchText}"
                            </button>
                        )}
                        {filteredSkills.length > 0 ? (
                            filteredSkills.map((skill, index) => (
                                <button
                                    key={index}
                                    onClick={() => addSkill(skill)}
                                    className="w-full px-4 py-2 text-left hover:bg-muted text-sm"
                                >
                                    {skill}
                                </button>
                            ))
                        ) : searchText && filteredSkills.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-muted-foreground">
                                No matching skills found
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Selected Skills Display with Drag and Drop */}
            {uniqueSelectedSkills.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={uniqueSelectedSkills}
                        strategy={rectSortingStrategy}
                    >
                        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border min-h-[50px]">
                            {uniqueSelectedSkills.map((skill) => (
                                <SortableSkillBadge
                                    key={skill}
                                    skill={skill}
                                    onRemove={removeSkill}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            <p className="text-xs text-muted-foreground">
                Drag to reorder.
            </p>
        </div>
    );
}
