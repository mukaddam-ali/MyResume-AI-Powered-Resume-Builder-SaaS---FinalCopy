import type { CondensedResume } from "./types";

/**
 * Only send what the letter pipeline needs — keeps tokens low and avoids
 * leaking layout/settings into the prompts. Includes projects (side-project
 * evidence often matters more than job history for early-career candidates).
 */
export function condenseResumeForCoverLetter(resumeData: any): CondensedResume {
    return {
        name: resumeData?.personalInfo?.fullName || "",
        jobTitle: resumeData?.personalInfo?.jobTitle || "",
        summary: resumeData?.personalInfo?.summary || "",
        skills: Array.isArray(resumeData?.skills) ? resumeData.skills.slice(0, 25) : [],
        experience: (resumeData?.experience || []).slice(0, 4).map((e: any) => ({
            role: e?.role || "",
            company: e?.company || "",
            highlights: (e?.description || "").substring(0, 600),
        })),
        projects: (resumeData?.projects || []).slice(0, 3).map((p: any) => ({
            name: p?.name || "",
            description: (p?.description || "").substring(0, 300),
            technologies: p?.technologies || "",
        })),
        education: (resumeData?.education || []).slice(0, 2).map((e: any) => ({
            degree: e?.degree || "",
            school: e?.school || "",
        })),
    };
}
