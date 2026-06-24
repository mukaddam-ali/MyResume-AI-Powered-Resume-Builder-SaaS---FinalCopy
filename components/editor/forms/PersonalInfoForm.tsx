"use client";
import React from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RichTextarea } from "@/components/ui/rich-textarea";

import { SectionScaleControl } from "../SectionScaleControl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SOCIAL_ICONS } from "@/components/preview/social-icons";

const SocialIcon = ({ id, className }: { id: string, className?: string }) => {
    const path = SOCIAL_ICONS[id];
    if (!path) return null;
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d={path} />
        </svg>
    );
};

const SOCIAL_PLATFORMS = [
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'snapchat', label: 'Snapchat' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'reddit', label: 'Reddit' },
    { id: 'x', label: 'X (Twitter)' },
    { id: 'youtube', label: 'YouTube' },
];

export function PersonalInfoForm() {
    const activeResumeId = useResumeStore((state) => state.activeResumeId);
    const personalInfo = useResumeStore((state) =>
        (state.activeResumeId && state.resumes[state.activeResumeId]?.personalInfo) || {
            fullName: '', jobTitle: '', email: '', phone: '', location: '',
            linkedin: '', website: '', github: '', summary: '', socialMedia: []
        }
    );
    const activeResume = useResumeStore((state) => state.activeResumeId ? state.resumes[state.activeResumeId] : null);
    const setPersonalInfo = useResumeStore((state) => state.setPersonalInfo);

    const handleSocialAdd = (platformId: string) => {
        const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
        if (!platform) return;

        const newSocial = {
            id: Math.random().toString(36).substr(2, 9),
            platform: platform.id,
            url: '',
            username: '',
            enabled: true
        };

        const currentSocials = personalInfo.socialMedia || [];
        setPersonalInfo({ socialMedia: [...currentSocials, newSocial] });
    };

    const handleSocialRemove = (id: string) => {
        const currentSocials = personalInfo.socialMedia || [];
        setPersonalInfo({ socialMedia: currentSocials.filter(s => s.id !== id) });
    };

    const handleSocialChange = (id: string, field: 'username' | 'url', value: string) => {
        const currentSocials = personalInfo.socialMedia || [];
        setPersonalInfo({
            socialMedia: currentSocials.map(s => s.id === id ? { ...s, [field]: value } : s)
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPersonalInfo({ [name]: value });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Personal Information</h2>
            </div>

            <SectionScaleControl sectionId="personal" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" value={personalInfo.fullName} onChange={handleChange} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input id="jobTitle" name="jobTitle" value={personalInfo.jobTitle || ''} onChange={handleChange} placeholder="Software Engineer" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" value={personalInfo.email} onChange={handleChange} placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" value={personalInfo.phone} onChange={handleChange} placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" value={personalInfo.location} onChange={handleChange} placeholder="Austin, TX" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input id="linkedin" name="linkedin" value={personalInfo.linkedin} onChange={handleChange} placeholder="linkedin.com/in/john" />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="github">GitHub</Label>
                    <Input id="github" name="github" value={personalInfo.github} onChange={handleChange} placeholder="github.com/john" />
                </div>

                {/* Social Media Section */}
                <div className="space-y-4 md:col-span-2 border-t pt-4 mt-2">
                    <div className="flex justify-between items-center">
                        <Label className="text-base font-semibold">Social Profiles</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Social Media
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {SOCIAL_PLATFORMS.map(platform => (
                                    <DropdownMenuItem key={platform.id} onClick={() => handleSocialAdd(platform.id)}>
                                        <SocialIcon id={platform.id} className="h-4 w-4 mr-2" />
                                        {platform.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {(personalInfo.socialMedia || []).map((social) => {
                            const platform = SOCIAL_PLATFORMS.find(p => p.id === social.platform);
                            return (
                                <div key={social.id} className="flex items-center gap-3 bg-muted/30 p-2 rounded-md border group">
                                    <div className="flex items-center justify-center w-8 h-8 bg-background rounded-full border shadow-sm">
                                        {/* Icon placeholder - rendered based on platform */}
                                        <SocialIcon id={social.platform} className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        <Input
                                            value={social.username}
                                            onChange={(e) => handleSocialChange(social.id, 'username', e.target.value)}
                                            placeholder={`${platform?.label} Username`}
                                            className="h-8 text-sm"
                                            aria-label={`${platform?.label || 'Social'} Username`}
                                        />
                                        <Input
                                            value={social.url}
                                            onChange={(e) => handleSocialChange(social.id, 'url', e.target.value)}
                                            placeholder="URL (Optional)"
                                            className="h-8 text-sm"
                                            aria-label={`${platform?.label || 'Social'} URL`}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleSocialRemove(social.id)}
                                        aria-label={`Remove ${platform?.label || 'social'} profile`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                        {(!personalInfo.socialMedia || personalInfo.socialMedia.length === 0) && (
                            <div className="text-center py-6 text-sm text-muted-foreground border-2 border-dashed rounded-md">
                                No social profiles added. Click the button above to add one.
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="website">Website / Portfolio</Label>
                    <Input id="website" name="website" value={personalInfo.website} onChange={handleChange} placeholder="johndoe.com" />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="summary">Professional Summary</Label>
                    <RichTextarea 
                        value={personalInfo.summary} 
                        onValueChange={(val: string) => useResumeStore.getState().setPersonalInfo({ summary: val })} 
                        placeholder="Brief summary for your resume..." 
                        className="min-h-[100px]" 
                    />
                </div>



                {/* Only show Photo Upload for templates that support it */}
                {['executive', 'designer', 'corporate'].includes(activeResume?.selectedTemplate || '') && (
                    <div className="md:col-span-2 space-y-4 border-t pt-4 mt-2">
                        <h3 className="font-semibold text-sm">Profile Picture</h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                {personalInfo.photo ? (
                                    <div className="relative w-20 h-20 rounded-full overflow-hidden border">
                                        <img
                                            src={personalInfo.photo}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            style={{
                                                filter: `brightness(${personalInfo.photoFilters?.brightness || 1}) contrast(${personalInfo.photoFilters?.contrast || 1}) grayscale(${personalInfo.photoFilters?.grayscale || 0})`,
                                                transform: `scale(${personalInfo.photoFilters?.scale || 1})`
                                            }}
                                        />
                                        <button
                                            onClick={() => setPersonalInfo({ photo: undefined })}
                                            className="absolute inset-0 bg-black/50 text-white opacity-0 hover:opacity-100 flex items-center justify-center text-xs"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                                        No Photo
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Label htmlFor="photo-upload" className="cursor-pointer inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
                                        Upload Photo
                                    </Label>
                                    <Input
                                        id="photo-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.size > 2 * 1024 * 1024) {
                                                    alert("Image size should be less than 2MB");
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setPersonalInfo({
                                                        photo: reader.result as string,
                                                        photoFilters: {
                                                            scale: 1,
                                                            brightness: 1,
                                                            contrast: 1,
                                                            grayscale: 0
                                                        }
                                                    });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Recommended: Square JPG/PNG, max 2MB.</p>
                                </div>
                            </div>

                            {personalInfo.photo && (
                                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-md">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <Label htmlFor="photo-zoom">Zoom</Label>
                                            <span className="text-muted-foreground">{personalInfo.photoFilters?.scale || 1}x</span>
                                        </div>
                                        <Input
                                            id="photo-zoom"
                                            type="range"
                                            min="1"
                                            max="3"
                                            step="0.1"
                                            value={personalInfo.photoFilters?.scale || 1}
                                            onChange={(e) => setPersonalInfo({
                                                photoFilters: { ...personalInfo.photoFilters!, scale: parseFloat(e.target.value) }
                                            })}
                                            className="h-6"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <Label htmlFor="photo-grayscale">Grayscale</Label>
                                            <span className="text-muted-foreground">{Math.round((personalInfo.photoFilters?.grayscale || 0) * 100)}%</span>
                                        </div>
                                        <Input
                                            id="photo-grayscale"
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={personalInfo.photoFilters?.grayscale || 0}
                                            onChange={(e) => setPersonalInfo({
                                                photoFilters: { ...personalInfo.photoFilters!, grayscale: parseFloat(e.target.value) }
                                            })}
                                            className="h-6"
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-3 border-t pt-2 mt-1">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="show-border" className="text-sm">Show Border</Label>
                                            <Switch
                                                id="show-border"
                                                checked={(personalInfo.photoFilters?.borderWidth || 0) > 0}
                                                onCheckedChange={(checked) => setPersonalInfo({
                                                    photoFilters: {
                                                        ...personalInfo.photoFilters!,
                                                        borderWidth: checked ? 4 : 0,
                                                        borderColor: checked ? '#ffffff' : undefined
                                                    }
                                                })}
                                            />
                                        </div>

                                        {(personalInfo.photoFilters?.borderWidth || 0) > 0 && (
                                            <div className="space-y-3 pt-2">
                                                <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                                                    <div className="flex justify-between text-xs">
                                                        <Label htmlFor="photo-border-width">Border Width</Label>
                                                        <span className="text-muted-foreground">{personalInfo.photoFilters?.borderWidth}px</span>
                                                    </div>
                                                    <Input
                                                        id="photo-border-width"
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        step="1"
                                                        value={personalInfo.photoFilters?.borderWidth || 4}
                                                        onChange={(e) => setPersonalInfo({
                                                            photoFilters: { ...personalInfo.photoFilters!, borderWidth: parseInt(e.target.value) }
                                                        })}
                                                        className="h-6"
                                                    />
                                                </div>
                                                <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                                                    <div className="flex justify-between text-xs">
                                                        <Label htmlFor="photo-border-color">Border Color</Label>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            id="photo-border-color"
                                                            type="color"
                                                            value={personalInfo.photoFilters?.borderColor || '#ffffff'}
                                                            onChange={(e) => setPersonalInfo({
                                                                photoFilters: { ...personalInfo.photoFilters!, borderColor: e.target.value }
                                                            })}
                                                            className="h-8 w-full p-1 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
