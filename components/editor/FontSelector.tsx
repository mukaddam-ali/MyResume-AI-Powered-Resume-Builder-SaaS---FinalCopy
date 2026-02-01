"use client";

import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Type, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FONT_OPTIONS = [
    // Sans-Serif - Free
    { id: 'roboto', name: 'Roboto (Default)', family: 'Roboto, sans-serif', premium: false },
    { id: 'opensans', name: 'Open Sans', family: 'Open Sans, sans-serif', premium: false },
    { id: 'lato', name: 'Lato', family: 'Lato, sans-serif', premium: false },
    { id: 'sourcesans', name: 'Source Sans 3', family: 'Source Sans 3, sans-serif', premium: false },

    // Premium
    { id: 'nunito', name: 'Nunito', family: 'Nunito, sans-serif', premium: true },
    { id: 'merriweather', name: 'Merriweather (Serif)', family: 'Merriweather, serif', premium: true },
    { id: 'librebaskerville', name: 'Libre Baskerville (Serif)', family: 'Libre Baskerville, serif', premium: true },
];

export function FontSelector() {
    const { resumes, activeResumeId, setFontFamily, userTier } = useResumeStore();
    const activeResume = activeResumeId ? resumes[activeResumeId] : null;
    const currentFont = activeResume?.fontFamily || 'roboto';

    const handleFontChange = (value: string) => {
        const font = FONT_OPTIONS.find(f => f.id === value);
        if (font?.premium && userTier === 'free') {
            alert("This is a Premium Font. Upgrade to Pro to use it.");
            return;
        }
        setFontFamily(value);
    };

    return (
        <div className="mb-6 bg-white dark:bg-black rounded-lg shadow-sm border p-4 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400">
                    <Type className="h-4 w-4" />
                </div>
                <div>
                    <Label className="text-sm font-semibold">Typography</Label>
                    <p className="text-xs text-muted-foreground">Select font style</p>
                </div>
            </div>

            <Select value={currentFont} onValueChange={handleFontChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Font" />
                </SelectTrigger>
                <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                        <SelectItem
                            key={font.id}
                            value={font.id}
                            disabled={font.premium && userTier === 'free'}
                            className="font-sans"
                        >
                            <div className="flex items-center justify-between w-full min-w-[200px]">
                                <span style={{ fontFamily: font.family }}>{font.name}</span>
                                {font.premium && <Crown className="w-3 h-3 text-yellow-500 ml-2" />}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
