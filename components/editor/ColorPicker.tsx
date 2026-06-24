
import React, { useState } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Lock, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import UpgradeButton from '@/components/payment/UpgradeButton';


const PRESET_COLORS = [
    { name: 'Classic Blue', value: '#112e51' },
    { name: 'Texas Red', value: '#CC5500' },
    { name: 'Emerald', value: '#059669' },
    { name: 'Purple', value: '#7c3aed' },
    { name: 'Rose', value: '#e11d48' },
    { name: 'Charcoal', value: '#333333' },
    { name: 'Teal', value: '#0d9488' },
    { name: 'Black', value: '#000000' },
];

export function ColorPicker() {
    const activeResumeId = useResumeStore(state => state.activeResumeId);
    const themeColor = useResumeStore(state => state.activeResumeId ? state.resumes[state.activeResumeId]?.themeColor : undefined) || '#112e51';
    const selectedTemplate = useResumeStore(state => state.activeResumeId ? state.resumes[state.activeResumeId]?.selectedTemplate : undefined);
    const setThemeColor = useResumeStore(state => state.setThemeColor);
    const userTier = useResumeStore(state => state.userTier);
    const [isOpen, setIsOpen] = useState(false);

    const isHidden = selectedTemplate === 'minimalist';

    if (isHidden) return null;

    return (
        <div className="bg-white dark:bg-black rounded-lg shadow-sm border p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md text-purple-600 dark:text-purple-400">
                        <Check className="w-4 h-4" />
                    </div>
                    <div>
                        <Label className="text-sm font-semibold">Accent Color</Label>
                        <p className="text-xs text-muted-foreground">Customize your resume theme</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
                {PRESET_COLORS.map((color) => (
                    <button
                        key={color.value}
                        onClick={() => setThemeColor(color.value)}
                        className={cn(
                            "w-8 h-8 rounded-full border border-muted-foreground/20 flex items-center justify-center transition-all hover:scale-110",
                            themeColor === color.value && "ring-2 ring-primary ring-offset-2 scale-110"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                        aria-label={`Set theme color to ${color.name}`}
                    >
                        {themeColor === color.value && (
                            <Check className="h-4 w-4 text-white drop-shadow-md" />
                        )}
                    </button>
                ))}

                <Popover>
                    <PopoverTrigger asChild>
                        <button 
                            className={cn(
                                "w-8 h-8 rounded-full border border-muted-foreground/20 flex items-center justify-center transition-all relative overflow-hidden group",
                                userTier === 'free' ? "cursor-not-allowed opacity-70" : "hover:scale-110"
                            )}
                            aria-label="Custom color picker"
                        >
                            <span className="sr-only">Custom Color</span>
                            <div className="w-full h-full absolute inset-0 bg-gradient-to-br from-red-500 via-green-500 to-blue-500 opacity-50" />
                            {userTier === 'free' ? (
                                <Lock className="w-3.5 h-3.5 text-gray-700 dark:text-gray-200 z-10" />
                            ) : (
                                <span className="text-[10px] font-bold text-gray-700 dark:text-white z-10">+</span>
                            )}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" align="end">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none flex items-center gap-2">
                                Custom Color
                                {userTier === 'free' && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">PRO</span>}
                            </h4>

                            {userTier === 'free' ? (
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-center space-y-2">
                                    <Lock className="w-4 h-4 mx-auto text-gray-400" />
                                    <p className="text-xs text-muted-foreground">
                                        Upgrade to Pro to check unlimited custom hex colors.
                                    </p>
                                    <UpgradeButton size="sm" variant="default" fullWidth>
                                        Unlock Colors
                                    </UpgradeButton>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={themeColor}
                                        onChange={(e) => setThemeColor(e.target.value)}
                                        className="w-12 h-10 p-1 cursor-pointer"
                                        aria-label="Custom theme color picker"
                                    />
                                    <Input
                                        type="text"
                                        value={themeColor}
                                        onChange={(e) => setThemeColor(e.target.value)}
                                        placeholder="#000000"
                                        className="flex-1 font-mono text-xs"
                                        aria-label="Custom hex theme color input"
                                    />
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );

}
