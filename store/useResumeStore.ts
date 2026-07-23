import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Education {
    id: string;
    school: string;
    degree: string;
    startDate: string;
    endDate: string;
    current: boolean;
}

export interface Experience {
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    technologies: string;
    link: string;
    linkText?: string; // Custom text to display for the link (e.g., "View Project", "GitHub")
    linkColor?: string; // Custom color for the link text (e.g., "#2563eb")
    image?: string;    // Card image for the portfolio page (compressed data URL)
    category?: string; // Portfolio filter chip (e.g. "Full Stack", "Frontend")
}

export interface SocialMedia {
    id: string;
    platform: string;
    url: string;
    username: string;
    enabled: boolean;
}

export interface PersonalInfo {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website: string;
    github: string;
    summary: string;
    photo?: string;
    photoFilters?: {
        scale: number; // 1 to 3
        brightness: number; // 0 to 2
        contrast: number; // 0 to 2
        grayscale: number; // 0 to 1
        borderWidth?: number; // px
        borderColor?: string;
        borderRadius?: number; // %
    };
    socialMedia?: SocialMedia[];
}

export type TemplateType = 'classic' | 'modern' | 'minimalist' | 'creative' | 'velvet';

export interface CustomSectionItem {
    id: string;
    name: string; // e.g. Award Name, Organization
    description: string;
    date: string;
    city?: string; // Optional location
}

export interface CustomSection {
    id: string;
    title: string; // e.g. "Volunteering"
    items: CustomSectionItem[];
}

export interface ResumeVariant {
    id: string;
    name: string; // e.g. "Frontend Dev", "PM Role"
    hiddenItems: {
        experience: string[]; // IDs of hidden experience entries
        education: string[];  // IDs of hidden education entries
        projects: string[];   // IDs of hidden projects
        skills: string[];     // Skill strings to hide
    };
    createdAt: number;
}

export interface ResumeData {
    id: string;
    name: string;
    lastModified: number;
    personalInfo: PersonalInfo;
    education: Education[];
    experience: Experience[];
    projects: Project[];
    skills: string[];
    customSections: CustomSection[];
    sectionOrder: string[]; // Can include custom section IDs
    sectionTitles: Record<string, string>;
    selectedTemplate: TemplateType;
    themeColor: string;
    contentScale: number;
    sectionSpacing?: number;

    fontFamily: string;
    analysisResult?: AnalysisResult | null;
    sectionScales?: Record<string, number>;
    isPublic?: boolean; // New: template visibility - defaults to false (private)
    hideBranding?: boolean; // Pro feature: hide "Powered by MyResume" branding

    // Multi-Variant support
    variants?: ResumeVariant[];
    activeVariantId?: string | null; // null = "Master" (show all)
}


export type UserTier = 'free' | 'pro';

export interface ATSParseTestResult {
    ok: boolean;
    extractionRate: number;
    emailFound: boolean;
    phoneFound: boolean;
    linkedinFound: boolean;
    headingsFound: string[];
    headingsMissing: string[];
    headingOrder: string[];
    twoColumnLayout: boolean;
    pageCount: number;
    extractedText: string;
}

export interface ATSAnalysisResult {
    score: number;
    category_scores: {
        impact: number;
        brevity: number;
        style: number;
        structure: number;
    };
    keywords: {
        found: string[];
        missing: string[];
    };
    feedback: string[];
    red_flags: string[];
    summary: string;
    // Deterministic scan extras (new engine)
    deterministic?: boolean;
    parse_score?: number;
    match_rate?: number | null;
    jd_skill_count?: number | null;
    parse?: ATSParseTestResult;
    metrics?: {
        bulletCount: number;
        quantifiedPct: number;
        actionVerbPct: number;
        avgBulletWords: number;
        totalWords: number;
    };
    suggested_edits?: Array<{
        location: string;
        original: string;
        suggestion: string;
        reason: string;
        // Present when matched back to a real flagged bullet — lets the UI
        // apply the rewrite directly into the resume data.
        entryType?: 'experience' | 'project' | 'custom';
        entryId?: string;
        customSectionId?: string;
        raw?: string;
    }>;
    weak_bullets?: Array<{
        section: string;
        entryLabel: string;
        entryType: 'experience' | 'project' | 'custom';
        entryId: string;
        customSectionId?: string;
        index: number;
        text: string;
        raw: string;
        issues: string[];
    }>;
}

export interface FreeAnalysisResult {
    isFreeAnalysis: true;
    overallScore: number;
    sections: {
        label: string;
        score: number;
        completed: boolean;
    }[];
}

export type AnalysisResult = ATSAnalysisResult | FreeAnalysisResult;

interface ATSCacheEntry {
    result: ATSAnalysisResult;
    timestamp: number;
}

interface ResumeState {
    //Multi-resume state
    resumes: Record<string, ResumeData>;
    activeResumeId: string | null;
    userTier: UserTier; // Cached from the server (/api/me); server is the source of truth
    setUserTier: (tier: UserTier) => void;

    // Tombstones: resumes deleted locally that must not be resurrected by
    // loadFromCloud's merge (e.g. delete happened while offline/logged out)
    deletedResumeIds: string[];

    syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
    lastSyncError: string | null;

    // ATS Analysis Cache
    atsAnalysisCache: Record<string, ATSCacheEntry>;
    setAnalysisCache: (hash: string, result: ATSAnalysisResult) => void;
    getAnalysisCache: (hash: string) => ATSAnalysisResult | null;

    // Content Actions



    // Content Actions (Operate on Active Resume)
    setPersonalInfo: (info: Partial<PersonalInfo>) => void;
    addEducation: (edu: Education) => void;
    removeEducation: (id: string) => void;
    updateEducation: (id: string, edu: Partial<Education>) => void;

    addExperience: (exp: Experience) => void;
    removeExperience: (id: string) => void;
    updateExperience: (id: string, exp: Partial<Experience>) => void;

    addProject: (proj: Project) => void;
    removeProject: (id: string) => void;
    updateProject: (id: string, proj: Partial<Project>) => void;

    setSkills: (skills: string | string[]) => void;
    setTemplate: (template: TemplateType) => void;
    setThemeColor: (color: string) => void;
    setAnalysisResult: (result: AnalysisResult | null) => void;
    reorderSections: (newOrder: string[]) => void;
    reorderItems: (sectionKey: keyof ResumeData, newItems: any[]) => void;
    setContentScale: (scale: number) => void;
    setSectionSpacing: (spacing: number) => void;
    setSectionScale: (sectionId: string, scale: number) => void;
    setFontFamily: (font: string) => void;
    setHideBranding: (hide: boolean) => void;

    // Custom Section Actions
    addCustomSection: (title: string) => void;
    removeSection: (sectionId: string) => void;
    addSection: (sectionId: string) => void;
    updateCustomSectionTitle: (sectionId: string, title: string) => void;
    addCustomItem: (sectionId: string, item: CustomSectionItem) => void;
    removeCustomItem: (sectionId: string, itemId: string) => void;
    updateCustomItem: (sectionId: string, itemId: string, item: Partial<CustomSectionItem>) => void;

    reorderCustomItems: (sectionId: string, newItems: CustomSectionItem[]) => void;

    // Section Renaming
    renameSection: (sectionId: string, title: string) => void;

    // Management Actions
    addResume: (name: string) => void;
    setActiveResume: (id: string) => void;
    updateResumeName: (id: string, name: string) => void;
    deleteResume: (id: string) => Promise<void>;
    duplicateResume: (id: string) => void;
    resetResume: (id: string) => void;

    // Cloud Sync Actions
    syncToCloud: (userId: string, resumeId?: string) => Promise<void>;
    loadFromCloud: (userId: string) => Promise<void>;
    setSyncStatus: (status: 'idle' | 'syncing' | 'synced' | 'error', error?: string) => void;

    // Public/Private Visibility Actions
    toggleResumeVisibility: (resumeId: string) => void;

    // Variant Management Actions
    addVariant: (resumeId: string, name: string) => void;
    removeVariant: (resumeId: string, variantId: string) => void;
    setActiveVariant: (resumeId: string, variantId: string | null) => void;
    toggleVariantItemVisibility: (resumeId: string, variantId: string, section: 'experience' | 'education' | 'projects' | 'skills', itemId: string) => void;
    renameVariant: (resumeId: string, variantId: string, name: string) => void;

    // Dev/Test
    loadExampleData: () => void;
}

// Cryptographically random IDs — resume IDs become public portfolio URLs
// (/p/{id}), so they must not be guessable.
const generateId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const useResumeStore = create<ResumeState>()(
    persist(
        (set, get) => ({
            userTier: 'free', // Default to free
            resumes: {},
            activeResumeId: null,
            deletedResumeIds: [],
            syncStatus: 'idle',
            lastSyncError: null,
            atsAnalysisCache: {},

            setUserTier: (tier) => set({ userTier: tier }),

            setAnalysisCache: (hash, result) => set((state) => ({
                atsAnalysisCache: {
                    ...state.atsAnalysisCache,
                    [hash]: {
                        result,
                        timestamp: Date.now()
                    }
                }
            })),

            getAnalysisCache: (hash) => {
                const entry = get().atsAnalysisCache[hash];
                if (!entry) return null;
                // Cache expires after 1 hour
                const isExpired = Date.now() - entry.timestamp > 60 * 60 * 1000;
                return isExpired ? null : entry.result;
            },

            // --- Content Actions ---
            setPersonalInfo: (info) =>
                set((state) => {
                    const resumeId = state.activeResumeId;
                    if (!resumeId) return {};
                    return {
                        resumes: {
                            ...state.resumes,
                            [resumeId]: {
                                ...state.resumes[resumeId],
                                personalInfo: { ...state.resumes[resumeId].personalInfo, ...info },
                                lastModified: Date.now(),
                            },
                        },
                    };
                }),

            setSectionScale: (sectionId, scale) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                const currentScales = state.resumes[resumeId].sectionScales || {};
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: {
                            ...state.resumes[resumeId],
                            sectionScales: { ...currentScales, [sectionId]: scale },
                            lastModified: Date.now()
                        }
                    }
                };
            }),

            addEducation: (edu) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                const resume = state.resumes[resumeId];
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: {
                            ...resume,
                            education: [...resume.education, edu],
                            lastModified: Date.now()
                        }
                    }
                };
            }),

            removeEducation: (id) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                const resume = state.resumes[resumeId];
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: {
                            ...resume,
                            education: resume.education.filter(e => e.id !== id),
                            lastModified: Date.now()
                        }
                    }
                };
            }),

            updateEducation: (id, edu) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                const resume = state.resumes[resumeId];
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: {
                            ...resume,
                            education: resume.education.map(e => e.id === id ? { ...e, ...edu } : e),
                            lastModified: Date.now()
                        }
                    }
                };
            }),

            addExperience: (exp) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                const resume = state.resumes[resumeId];
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: {
                            ...resume,
                            experience: [...resume.experience, exp],
                            lastModified: Date.now()
                        }
                    }
                };
            }),

            removeExperience: (id) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                const resume = state.resumes[resumeId];
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: {
                            ...resume,
                            experience: resume.experience.filter(e => e.id !== id),
                            lastModified: Date.now()
                        }
                    }
                };
            }),

            updateExperience: (id, exp) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                const resume = state.resumes[resumeId];
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: {
                            ...resume,
                            experience: resume.experience.map(e => e.id === id ? { ...e, ...exp } : e),
                            lastModified: Date.now()
                        }
                    }
                };
            }),

            addProject: (proj) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                const resume = state.resumes[resumeId];
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: {
                            ...resume,
                            projects: [...resume.projects, proj],
                            lastModified: Date.now()
                        }
                    }
                };
            }),

            removeProject: (id) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                const resume = state.resumes[resumeId];
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: {
                            ...resume,
                            projects: resume.projects.filter(p => p.id !== id),
                            lastModified: Date.now()
                        }
                    }
                };
            }),

            updateProject: (id, proj) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                const resume = state.resumes[resumeId];
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: {
                            ...resume,
                            projects: resume.projects.map(p => p.id === id ? { ...p, ...proj } : p),
                            lastModified: Date.now()
                        }
                    }
                };
            }),

            setSkills: (skills) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                // Normalize skills to array if it's a string
                const normalizedSkills = typeof skills === 'string'
                    ? skills.split(',').map(s => s.trim()).filter(Boolean)
                    : skills;
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: { ...state.resumes[resumeId], skills: normalizedSkills, lastModified: Date.now() }
                    }
                };
            }),

            setTemplate: (template) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: {
                            ...state.resumes[resumeId],
                            selectedTemplate: template,
                            contentScale: 1,
                            sectionScales: {},
                            lastModified: Date.now()
                        }
                    }
                };
            }),

            setThemeColor: (color) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: { ...state.resumes[resumeId], themeColor: color, lastModified: Date.now() }
                    }
                };
            }),

            setAnalysisResult: (result) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: { ...state.resumes[resumeId], analysisResult: result, lastModified: Date.now() }
                    }
                };
            }),

            reorderSections: (newOrder) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: { ...state.resumes[resumeId], sectionOrder: newOrder, lastModified: Date.now() }
                    }
                };
            }),

            reorderItems: (sectionKey, newItems) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: { ...state.resumes[resumeId], [sectionKey]: newItems, lastModified: Date.now() }
                    }
                };
            }),

            setContentScale: (scale) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: { ...state.resumes[resumeId], contentScale: scale, lastModified: Date.now() }
                    }
                };
            }),

            setSectionSpacing: (spacing) => set((state) => {
                const resumeId = state.activeResumeId;
                if (!resumeId) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: { ...state.resumes[resumeId], sectionSpacing: spacing, lastModified: Date.now() }
                    }
                };
            }),

            addCustomSection: (title) => set((state) => {
                const activeResume = state.resumes[state.activeResumeId!];
                if (!activeResume) return {};
                const id = `custom-${Math.random().toString(36).substring(2, 9)}`;
                const newSection: CustomSection = {
                    id,
                    title,
                    items: []
                };
                return {
                    resumes: {
                        ...state.resumes,
                        [activeResume.id]: {
                            ...activeResume,
                            customSections: [...(activeResume.customSections || []), newSection],
                            sectionOrder: [...activeResume.sectionOrder, id],
                            lastModified: Date.now(),
                        }
                    }
                };
            }),
            removeSection: (sectionId) => set((state) => {
                const activeResume = state.resumes[state.activeResumeId!];
                if (!activeResume) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [activeResume.id]: {
                            ...activeResume,
                            // Filter out from customSections (if it was custom)
                            customSections: activeResume.customSections.filter(s => s.id !== sectionId),
                            // Filter out from sectionOrder (hides standard sections too)
                            sectionOrder: activeResume.sectionOrder.filter(id => id !== sectionId),
                            lastModified: Date.now(),
                        }
                    }
                };
            }),
            addSection: (sectionId) => set((state) => {
                const activeResume = state.resumes[state.activeResumeId!];
                if (!activeResume) return {};
                // If already present, do nothing
                if (activeResume.sectionOrder.includes(sectionId)) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [activeResume.id]: {
                            ...activeResume,
                            sectionOrder: [...activeResume.sectionOrder, sectionId],
                            lastModified: Date.now(),
                        }
                    }
                };
            }),
            updateCustomSectionTitle: (sectionId, title) => set((state) => {
                const activeResume = state.resumes[state.activeResumeId!];
                if (!activeResume) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [activeResume.id]: {
                            ...activeResume,
                            customSections: activeResume.customSections.map(s => s.id === sectionId ? { ...s, title } : s),
                            lastModified: Date.now(),
                        }
                    }
                };
            }),
            addCustomItem: (sectionId, item) => set((state) => {
                const activeResume = state.resumes[state.activeResumeId!];
                if (!activeResume) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [activeResume.id]: {
                            ...activeResume,
                            customSections: activeResume.customSections.map(s =>
                                s.id === sectionId ? { ...s, items: [...s.items, item] } : s
                            ),
                            lastModified: Date.now(),
                        }
                    }
                };
            }),
            removeCustomItem: (sectionId, itemId) => set((state) => {
                const activeResume = state.resumes[state.activeResumeId!];
                if (!activeResume) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [activeResume.id]: {
                            ...activeResume,
                            customSections: activeResume.customSections.map(s =>
                                s.id === sectionId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s
                            ),
                            lastModified: Date.now(),
                        }
                    }
                };
            }),
            updateCustomItem: (sectionId, itemId, item) => set((state) => {
                const activeResume = state.resumes[state.activeResumeId!];
                if (!activeResume) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [activeResume.id]: {
                            ...activeResume,
                            customSections: activeResume.customSections.map(s =>
                                s.id === sectionId ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, ...item } : i) } : s
                            ),
                            lastModified: Date.now(),
                        }
                    }
                };
            }),
            reorderCustomItems: (sectionId, newItems) => set((state) => {
                const activeResume = state.resumes[state.activeResumeId!];
                if (!activeResume) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [activeResume.id]: {
                            ...activeResume,
                            customSections: activeResume.customSections.map(s =>
                                s.id === sectionId ? { ...s, items: newItems } : s
                            ),
                            lastModified: Date.now(),
                        }
                    }
                };
            }),



            renameSection: (sectionId, title) => set((state) => {
                const activeResume = state.resumes[state.activeResumeId!];
                if (!activeResume) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [activeResume.id]: {
                            ...activeResume,
                            sectionTitles: {
                                ...activeResume.sectionTitles,
                                [sectionId]: title
                            },
                            lastModified: Date.now(),
                        }
                    }
                };
            }),


            setFontFamily: (font) => set((state) => {
                const activeId = state.activeResumeId;
                if (!activeId || !state.resumes[activeId]) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [activeId]: {
                            ...state.resumes[activeId],
                            fontFamily: font,
                            lastModified: Date.now()
                        }
                    }
                }
            }),

            setHideBranding: (hide) => set((state) => {
                const activeId = state.activeResumeId;
                if (!activeId || !state.resumes[activeId]) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [activeId]: {
                            ...state.resumes[activeId],
                            hideBranding: hide,
                            lastModified: Date.now()
                        }
                    }
                };
            }),

            // --- Management Actions ---
            addResume: (name) => set((state) => {
                const id = generateId();
                const newResume: ResumeData = {
                    id,
                    name,
                    lastModified: Date.now(),
                    personalInfo: {
                        fullName: "New User",
                        jobTitle: "",
                        email: "",
                        phone: "",
                        location: "",
                        linkedin: "",
                        website: "",
                        github: "",
                        summary: "",
                        photoFilters: {
                            scale: 1,
                            brightness: 1,
                            contrast: 1,
                            grayscale: 0,
                            borderWidth: 0,
                            borderColor: '#ffffff'
                        }
                    },
                    education: [],
                    experience: [],
                    projects: [],
                    skills: [],
                    customSections: [], // Initialize
                    sectionOrder: ['personal', 'education', 'experience', 'projects', 'skills'],
                    sectionTitles: {},
                    selectedTemplate: 'modern',
                    themeColor: '#3b82f6',
                    contentScale: 1,
                    sectionSpacing: 1,

                    fontFamily: 'roboto',
                    sectionScales: {},
                };
                return {
                    resumes: { ...state.resumes, [id]: newResume },
                    activeResumeId: id
                };
            }),

            setActiveResume: (id) => set({ activeResumeId: id }),

            updateResumeName: (id, name) => set((state) => ({
                resumes: {
                    ...state.resumes,
                    [id]: { ...state.resumes[id], name, lastModified: Date.now() }
                }
            })),

            deleteResume: async (id) => {
                const state = get();
                const resume = state.resumes[id];

                // If resume was public, unpublish it from database first
                if (resume?.isPublic) {
                    try {
                        await fetch('/api/templates/unpublish', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ resumeId: id })
                        });
                    } catch (error) {
                        console.error('Error unpublishing template on delete:', error);
                        // Continue with deletion even if unpublish fails
                    }
                }

                // Delete from cloud. If it fails (offline, logged out), keep a
                // tombstone so loadFromCloud doesn't resurrect the resume later.
                let cloudDeleted = false;
                try {
                    const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
                    cloudDeleted = res.ok;
                } catch (error) {
                    console.error('Error deleting resume from cloud:', error);
                }

                set((state) => {
                    const newResumes = { ...state.resumes };
                    delete newResumes[id];
                    const activeId = state.activeResumeId === id
                        ? (Object.keys(newResumes)[0] || null)
                        : state.activeResumeId;
                    const tombstones = cloudDeleted
                        ? state.deletedResumeIds.filter(t => t !== id)
                        : Array.from(new Set([...state.deletedResumeIds, id]));
                    return { resumes: newResumes, activeResumeId: activeId, deletedResumeIds: tombstones };
                });
            },

            duplicateResume: (id) => set((state) => {
                const source = state.resumes[id];
                if (!source) return {};
                const newId = generateId();
                const newResume = {
                    ...source,
                    id: newId,
                    name: `${source.name} (Copy)`,
                    lastModified: Date.now()
                };
                return {
                    resumes: { ...state.resumes, [newId]: newResume },
                    activeResumeId: newId
                };
            }),

            resetResume: (id) => set((state) => {
                const source = state.resumes[id];
                if (!source) return {};

                // Explicitly construct a fresh object. Do NOT spread source.
                // This ensures no "ghost keys" survive.
                const resetData: ResumeData = {
                    id: source.id,
                    name: source.name,
                    lastModified: Date.now(),
                    personalInfo: {
                        fullName: "",
                        jobTitle: "",
                        email: "",
                        phone: "",
                        location: "",
                        linkedin: "",
                        website: "",
                        github: "",
                        summary: "",
                        photoFilters: {
                            scale: 1,
                            brightness: 1,
                            contrast: 1,
                            grayscale: 0,
                            borderWidth: 0,
                            borderColor: '#ffffff'
                        }
                    },
                    education: [],
                    experience: [],
                    projects: [],
                    skills: [],
                    customSections: [], // Explicitly empty
                    sectionOrder: ['personal', 'education', 'experience', 'projects', 'skills'],
                    sectionTitles: {},
                    selectedTemplate: source.selectedTemplate, // Keep template
                    themeColor: source.themeColor, // Keep theme
                    contentScale: 1,

                    fontFamily: source.fontFamily || 'roboto',
                    sectionScales: {},
                };

                return {
                    resumes: { ...state.resumes, [id]: resetData }
                };
            }),

            // --- Cloud Sync Actions ---
            syncToCloud: async (userId: string, resumeId?: string) => {
                const state = get();
                set({ syncStatus: 'syncing' });

                try {
                    // Retry any pending tombstoned deletions first
                    const tombstones = state.deletedResumeIds;
                    for (const deletedId of tombstones) {
                        try {
                            const res = await fetch(`/api/resumes/${deletedId}`, { method: 'DELETE' });
                            if (res.ok) {
                                set((s) => ({ deletedResumeIds: s.deletedResumeIds.filter(t => t !== deletedId) }));
                            }
                        } catch {
                            // Still offline — keep the tombstone for next time
                        }
                    }

                    // Sync one resume (autosave) or all of them (login/full sync)
                    const toSync = resumeId && state.resumes[resumeId]
                        ? [state.resumes[resumeId]]
                        : Object.values(state.resumes);

                    const resumePromises = toSync.map(async (resume) => {
                        const response = await fetch(`/api/resumes/${resume.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: resume.name,
                                data: resume,
                            }),
                        });

                        if (response.status === 404 || response.status === 406) {
                            // Resume truly doesn't exist in cloud yet — create it
                            const created = await fetch('/api/resumes', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    name: resume.name,
                                    data: resume,
                                }),
                            });
                            // 409 = row already exists (concurrent create) — fine
                            if (!created.ok && created.status !== 409) {
                                throw new Error('Failed to save resume to cloud');
                            }
                        } else if (!response.ok) {
                            const body = await response.json().catch(() => null);
                            throw new Error(body?.error || 'Failed to save resume to cloud');
                        }
                    });

                    await Promise.all(resumePromises);
                    set({ syncStatus: 'synced', lastSyncError: null });
                } catch (error) {
                    set({ syncStatus: 'error', lastSyncError: (error as Error).message });
                }
            },

            loadFromCloud: async (userId: string) => {
                set({ syncStatus: 'syncing' });

                try {
                    const response = await fetch('/api/resumes');
                    if (!response.ok) throw new Error('Failed to fetch resumes');

                    const { resumes: cloudResumes } = await response.json();

                    if (cloudResumes && cloudResumes.length > 0) {
                        // Build a de-duplicated map from cloud data:
                        // If multiple rows share the same data.id (old duplicate bug),
                        // keep only the one with the latest last_modified.
                        const deletedIds = new Set(get().deletedResumeIds);
                        const cloudMap: Record<string, ResumeData> = {};
                        cloudResumes.forEach((r: any) => {
                            // Skip resumes deleted locally but not yet deleted in
                            // the cloud (tombstoned) — don't resurrect them
                            if (deletedIds.has(r.data.id)) return;
                            const existing = cloudMap[r.data.id];
                            if (!existing || r.data.lastModified > existing.lastModified) {
                                cloudMap[r.data.id] = r.data;
                            }
                        });

                        // Merge with local store: for each resume, keep whichever
                        // version (local vs cloud) has the newer lastModified.
                        const localResumes = get().resumes;
                        const mergedMap: Record<string, ResumeData> = { ...cloudMap };

                        Object.values(localResumes).forEach((localResume) => {
                            const cloudVersion = cloudMap[localResume.id];
                            if (!cloudVersion || localResume.lastModified > cloudVersion.lastModified) {
                                // Local is newer — keep local version
                                mergedMap[localResume.id] = localResume;
                            }
                        });

                        // Preserve current activeResumeId if it still exists, otherwise use first
                        const currentActiveId = get().activeResumeId;
                        const newActiveId = currentActiveId && mergedMap[currentActiveId]
                            ? currentActiveId
                            : Object.keys(mergedMap)[0] || null;

                        set({
                            resumes: mergedMap,
                            activeResumeId: newActiveId,
                            syncStatus: 'synced',
                            lastSyncError: null,
                        });
                    } else {
                        set({ syncStatus: 'synced' });
                    }
                } catch (error) {
                    set({ syncStatus: 'error', lastSyncError: (error as Error).message });
                }
            },

            setSyncStatus: (status, error) => set({ syncStatus: status, lastSyncError: error || null }),

            // Public/Private Visibility Actions
            toggleResumeVisibility: async (resumeId) => {
                const state = get();
                const resume = state.resumes[resumeId];

                if (!resume) return;

                const newIsPublic = !resume.isPublic;

                // Optimistically update local state
                set((state) => ({
                    resumes: {
                        ...state.resumes,
                        [resumeId]: {
                            ...state.resumes[resumeId],
                            isPublic: newIsPublic,
                            lastModified: Date.now()
                        }
                    }
                }));

                // Sync to Supabase
                try {
                    if (newIsPublic) {
                        // Publish to database
                        const response = await fetch('/api/templates/publish', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                resumeId,
                                resumeData: resume
                            })
                        });

                        if (response.status === 401) {
                            throw new Error('Sign in to publish your resume publicly.');
                        }
                        if (!response.ok) {
                            throw new Error('Failed to publish template');
                        }
                    } else {
                        // Unpublish from database
                        const response = await fetch('/api/templates/unpublish', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ resumeId })
                        });

                        if (!response.ok) {
                            throw new Error('Failed to unpublish template');
                        }
                    }
                } catch (error) {
                    console.error('Error syncing template visibility:', error);
                    // Revert on error and tell the user why
                    set((state) => ({
                        resumes: {
                            ...state.resumes,
                            [resumeId]: {
                                ...state.resumes[resumeId],
                                isPublic: !newIsPublic,
                                lastModified: Date.now()
                            }
                        }
                    }));
                    if (typeof window !== 'undefined') {
                        alert((error as Error).message || 'Could not update visibility. Please try again.');
                    }
                }
            },

            // --- Variant Management Actions ---
            addVariant: (resumeId, name) => set((state) => {
                const resume = state.resumes[resumeId];
                if (!resume) return {};
                const newVariant: ResumeVariant = {
                    id: Math.random().toString(36).substring(2, 9),
                    name,
                    hiddenItems: { experience: [], education: [], projects: [], skills: [] },
                    createdAt: Date.now(),
                };
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: {
                            ...resume,
                            variants: [...(resume.variants || []), newVariant],
                            activeVariantId: newVariant.id,
                            lastModified: Date.now(),
                        }
                    }
                };
            }),

            removeVariant: (resumeId, variantId) => set((state) => {
                const resume = state.resumes[resumeId];
                if (!resume) return {};
                const remaining = (resume.variants || []).filter(v => v.id !== variantId);
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: {
                            ...resume,
                            variants: remaining,
                            activeVariantId: resume.activeVariantId === variantId ? null : resume.activeVariantId,
                            lastModified: Date.now(),
                        }
                    }
                };
            }),

            setActiveVariant: (resumeId, variantId) => set((state) => {
                const resume = state.resumes[resumeId];
                if (!resume) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: { ...resume, activeVariantId: variantId, lastModified: Date.now() }
                    }
                };
            }),

            toggleVariantItemVisibility: (resumeId, variantId, section, itemId) => set((state) => {
                const resume = state.resumes[resumeId];
                if (!resume) return {};
                const variants = (resume.variants || []).map(v => {
                    if (v.id !== variantId) return v;
                    const hiddenList = v.hiddenItems[section] || [];
                    const isHidden = hiddenList.includes(itemId);
                    return {
                        ...v,
                        hiddenItems: {
                            ...v.hiddenItems,
                            [section]: isHidden
                                ? hiddenList.filter(id => id !== itemId)
                                : [...hiddenList, itemId],
                        }
                    };
                });
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: { ...resume, variants, lastModified: Date.now() }
                    }
                };
            }),

            renameVariant: (resumeId, variantId, name) => set((state) => {
                const resume = state.resumes[resumeId];
                if (!resume) return {};
                return {
                    resumes: {
                        ...state.resumes,
                        [resumeId]: {
                            ...resume,
                            variants: (resume.variants || []).map(v => v.id === variantId ? { ...v, name } : v),
                            lastModified: Date.now(),
                        }
                    }
                };
            }),

            loadExampleData: () => set((state) => {
                const activeId = state.activeResumeId;
                if (!activeId) {
                    const id = "example-resume";
                    return {
                        resumes: {
                            [id]: {
                                id,
                                name: "My First Resume",
                                lastModified: Date.now(),
                                personalInfo: {
                                    fullName: "Alex 'LoneStar' Dev",
                                    jobTitle: "Senior Full Stack Developer",
                                    email: "alex@lonestar.dev",
                                    phone: "(512) 555-0199",
                                    location: "Austin, TX",
                                    linkedin: "linkedin.com/in/alexdev",
                                    website: "alexdev.io",
                                    github: "github.com/alexdev",
                                    summary: "Full-stack developer with 5+ years of experience building scalable web applications. Reduced system latency by 60% across production apps serving 100K+ users. Specialized in React, Node.js, and AWS.",
                                },
                                education: [{
                                    id: "1", school: "University of Texas at Austin", degree: "B.S. Computer Science", startDate: "Aug 2019", endDate: "May 2023", current: false
                                }],
                                experience: [
                                    {
                                        id: "1",
                                        company: "TechGiant Corp",
                                        role: "Software Engineer Intern",
                                        startDate: "May 2022",
                                        endDate: "Aug 2022",
                                        current: false,
                                        description: "• Built real-time analytics dashboard using React and D3.js, processing 50K+ events/sec and improving load times by 40%\n• Optimized PostgreSQL queries reducing response time from 800ms to 120ms for 25K+ daily users\n• Implemented CI/CD pipeline with GitHub Actions, cutting deployment time by 65%"
                                    },
                                    {
                                        id: "2",
                                        company: "StartupInc",
                                        role: "Full Stack Developer",
                                        startDate: "Jun 2023",
                                        endDate: "Present",
                                        current: true,
                                        description: "• Architected microservices e-commerce platform using Node.js and MongoDB, supporting 15K+ monthly transactions and $500K+ revenue\n• Led migration to Next.js with TypeScript, reducing bundle size by 45% and improving Core Web Vitals from 62 to 94\n• Deployed AWS serverless architecture (Lambda, DynamoDB), cutting infrastructure costs by $18K/month"
                                    }
                                ],
                                projects: [{
                                    id: "1",
                                    name: "LoneStar Resume Builder",
                                    description: "• Built ATS-optimized SaaS platform using Next.js, TypeScript, and Tailwind CSS, serving 10K+ users with 4.8/5 rating\n• Integrated Gemini AI for resume analysis, processing 500+ daily requests with 95% accuracy",
                                    technologies: "Next.js, TypeScript, Tailwind CSS, Supabase, PostgreSQL, Gemini AI",
                                    link: "https://lonestar-resume.com"
                                }],
                                skills: ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express", "PostgreSQL", "MongoDB", "AWS (Lambda, S3, DynamoDB)", "Docker", "Git", "CI/CD", "REST APIs", "GraphQL", "Tailwind CSS"],
                                customSections: [],
                                sectionOrder: ['personal', 'education', 'experience', 'projects', 'skills'],
                                sectionTitles: {},
                                selectedTemplate: get().resumes[id]?.selectedTemplate || 'modern',
                                themeColor: get().resumes[id]?.themeColor || '#112e51',
                                contentScale: 1,
            
                                fontFamily: 'roboto'
                            }
                        },
                        activeResumeId: id
                    };
                }
                return {
                    resumes: {
                        ...state.resumes,
                        [activeId]: {
                            ...state.resumes[activeId],
                            personalInfo: {
                                fullName: "Alex Morgan",
                                jobTitle: "Senior Software Engineer",
                                email: "alex.morgan@example.com",
                                phone: "(512) 555-0199",
                                location: "Austin, TX",
                                linkedin: "linkedin.com/in/alexdev",
                                website: "alexdev.io",
                                github: "github.com/alexdev",
                                summary: "Full-stack developer with 5+ years of experience building scalable web applications. Reduced system latency by 60% across production apps serving 100K+ users. Specialized in React, Node.js, and AWS.",
                            },
                            education: [{
                                id: "1", school: "University of Texas at Austin", degree: "B.S. Computer Science", startDate: "Aug 2019", endDate: "May 2023", current: false
                            }],
                            experience: [
                                {
                                    id: "1",
                                    company: "TechGiant Corp",
                                    role: "Software Engineer Intern",
                                    startDate: "May 2022",
                                    endDate: "Aug 2022",
                                    current: false,
                                    description: "• Built real-time analytics dashboard using React and D3.js, processing 50K+ events/sec and improving load times by 40%\n• Optimized PostgreSQL queries reducing response time from 800ms to 120ms for 25K+ daily users\n• Implemented CI/CD pipeline with GitHub Actions, cutting deployment time by 65%"
                                },
                                {
                                    id: "2",
                                    company: "StartupInc",
                                    role: "Full Stack Developer",
                                    startDate: "Jun 2023",
                                    endDate: "Present",
                                    current: true,
                                    description: "• Architected microservices e-commerce platform using Node.js and MongoDB, supporting 15K+ monthly transactions and $500K+ revenue\n• Led migration to Next.js with TypeScript, reducing bundle size by 45% and improving Core Web Vitals from 62 to 94\n• Deployed AWS serverless architecture (Lambda, DynamoDB), cutting infrastructure costs by $18K/month"
                                }
                            ],
                            projects: [{
                                id: "1",
                                name: "LoneStar Resume Builder",
                                description: "• Built ATS-optimized SaaS platform using Next.js, TypeScript, and Tailwind CSS, serving 10K+ users with 4.8/5 rating\n• Integrated Gemini AI for resume analysis, processing 500+ daily requests with 95% accuracy",
                                technologies: "Next.js, TypeScript, Tailwind CSS, Supabase, PostgreSQL, Gemini AI",
                                link: "https://lonestar-resume.com"
                            }],
                            skills: ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express", "PostgreSQL", "MongoDB", "AWS (Lambda, S3, DynamoDB)", "Docker", "Git", "CI/CD", "REST APIs", "GraphQL", "Tailwind CSS"],
                            customSections: (state.resumes[activeId].customSections || []),
                            sectionOrder: ['personal', 'education', 'experience', 'projects', 'skills'],
                            sectionTitles: {},
                        }
                    }
                };
            }),
        }),
        {
            name: 'myresume-storage-v2',
            onRehydrateStorage: () => (state) => {
                if (state && (!state.resumes || Object.keys(state.resumes).length === 0)) {
                    state.addResume("My Resume");
                }
            }
        }
    )
);
