"use client";

import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SectionScaleControlProps {
    sectionId: string;
}

export function SectionScaleControl({ sectionId }: SectionScaleControlProps) {
    const activeResumeId = useResumeStore((state) => state.activeResumeId);
    const scale = useResumeStore((state) => state.activeResumeId ? state.resumes[state.activeResumeId]?.sectionScales?.[sectionId] : undefined) ?? 1;
    const setSectionScale = useResumeStore((state) => state.setSectionScale);

    if (!activeResumeId) return null;

    const handleScaleChange = (value: number[]) => {
        setSectionScale(sectionId, value[0]);
    };

    const handleReset = () => {
        setSectionScale(sectionId, 1);
    };

    return (
        <div className="flex items-center gap-2 sm:gap-4 mb-4 p-2 sm:p-3 bg-muted/30 rounded-md border text-xs">
            <Label className="whitespace-nowrap font-medium text-xs">Font Scaling:</Label>
            <Slider
                value={[scale]}
                min={0.5}
                max={1.5}
                step={0.05}
                onValueChange={handleScaleChange}
                className="w-[100px] sm:w-[120px]"
                aria-label={`Font scaling for ${sectionId} section`}
            />
            <span className="w-8 text-right font-mono text-muted-foreground">{Math.round(scale * 100)}%</span>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-auto"
                onClick={handleReset}
                title="Reset Scale"
                aria-label="Reset Font Scale"
            >
                <RotateCcw className="h-3 w-3" />
            </Button>
        </div>
    );
}
