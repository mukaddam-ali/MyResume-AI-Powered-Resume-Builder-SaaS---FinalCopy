"use client";

import React from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Type, Crown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import UpgradeButton from '@/components/payment/UpgradeButton';

export const FONT_OPTIONS = [
    // --- FREE FONTS ---
    { id: 'inter', name: 'Inter (Clean)', family: 'var(--font-inter)', premium: false },
    { id: 'roboto', name: 'Roboto (Classic)', family: 'Roboto, sans-serif', premium: false },
    { id: 'merriweather', name: 'Merriweather (Slab)', family: 'var(--font-merriweather)', premium: false },
    { id: 'oswald', name: 'Oswald (Condensed)', family: 'var(--font-oswald)', premium: false },

    // --- PREMIUM FONTS (Pro Plan Only) ---
    // Modern Sans
    { id: 'manrope', name: 'Manrope (Modern)', family: 'var(--font-manrope)', premium: true },
    { id: 'dm-sans', name: 'DM Sans (Friendly)', family: 'var(--font-dm-sans)', premium: true },
    { id: 'montserrat', name: 'Montserrat (Geometric)', family: 'var(--font-montserrat)', premium: true },
    { id: 'raleway', name: 'Raleway (Elegant)', family: 'var(--font-raleway)', premium: true },
    { id: 'space-grotesk', name: 'Space Grotesk (Tech)', family: 'var(--font-space-grotesk)', premium: true },

    // Elegant Serif
    { id: 'playfair', name: 'Playfair Display', family: 'var(--font-playfair)', premium: true },
    { id: 'lora', name: 'Lora (Calligraphic)', family: 'var(--font-lora)', premium: true },
    { id: 'pt-serif', name: 'PT Serif (Academic)', family: 'var(--font-pt-serif)', premium: true },
    { id: 'libre-baskerville', name: 'Libre Baskerville', family: 'var(--font-libre-baskerville)', premium: true },
    { id: 'crimson-pro', name: 'Crimson Pro', family: 'var(--font-crimson-pro)', premium: true },
];

export function FontSelector() {
    const { resumes, activeResumeId, setFontFamily, userTier } = useResumeStore();
    const activeResume = activeResumeId ? resumes[activeResumeId] : null;
    const currentFont = activeResume?.fontFamily || 'roboto';
    const [showUpgradeDialog, setShowUpgradeDialog] = React.useState(false);

    const handleFontChange = (value: string) => {
        const font = FONT_OPTIONS.find(f => f.id === value);
        if (font?.premium && userTier === 'free') {
            setShowUpgradeDialog(true);
            return;
        }
        setFontFamily(value);
    };

    return (
        <>
            <div className="bg-white dark:bg-black rounded-lg shadow-sm border p-4 flex flex-col justify-between h-full">
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

            <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-yellow-500" />
                            Premium Font
                        </DialogTitle>
                        <DialogDescription>
                            This is a premium font. Upgrade to Pro to unlock all premium fonts and features.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 pt-4">
                        <UpgradeButton fullWidth />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
