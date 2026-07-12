import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import PortfolioPage from "@/components/portfolio/PortfolioPage";

interface Props {
    params: Promise<{ resumeId: string }>;
}

async function getPublicResume(resumeId: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return null;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
        .from("public_templates")
        .select("*")
        .eq("resume_id", resumeId)
        .single();

    if (error || !data) return null;
    return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { resumeId } = await params;
    const template = await getPublicResume(resumeId);
    if (!template) {
        return { title: "Portfolio Not Found | MyResume" };
    }
    const name = (template.resume_data as any)?.personalInfo?.fullName || "Resume";
    const title = (template.resume_data as any)?.personalInfo?.jobTitle || "";
    return {
        title: `${name}${title ? ` — ${title}` : ""} | MyResume Portfolio`,
        description: `View ${name}'s professional resume and portfolio, built with MyResume.`,
        openGraph: {
            title: `${name}'s Portfolio`,
            description: `${title} — View professional resume built with MyResume.`,
            type: "profile",
        },
    };
}

export default async function PublicPortfolioPage({ params }: Props) {
    const { resumeId } = await params;
    const template = await getPublicResume(resumeId);

    if (!template) {
        notFound();
    }

    return <PortfolioPage resumeData={template.resume_data as any} resumeId={resumeId} />;
}
