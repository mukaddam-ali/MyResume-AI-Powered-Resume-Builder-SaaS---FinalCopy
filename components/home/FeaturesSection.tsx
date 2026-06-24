"use client";

import { CheckCircle2, FileText, Zap, LayoutTemplate, ShieldCheck, Sparkles } from "lucide-react";
import { LazyMotion, domAnimation, m } from "framer-motion";

export function FeaturesSection() {
    const featureContainerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const featureCardVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    return (
        <LazyMotion features={domAnimation}>
            <section id="features" className="w-full space-y-16 py-24 md:py-32">
                <div className="mx-auto max-w-[58rem] text-center">
                    <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">
                        Everything you need to get the job
                    </h2>
                    <p className="mt-4 text-muted-foreground sm:text-lg">
                        Built by engineers, for engineers. Our templates are designed to pass ATS filters and impress human recruiters.
                    </p>
                </div>

                <m.div
                    variants={featureContainerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3"
                >
                    <FeatureCard variants={featureCardVariants}
                        icon={<Zap className="h-6 w-6 text-blue-500" />}
                        title="Instant Preview"
                        description="See changes in real-time. No loading spinners, no waiting. Just type and see."
                    />
                    <FeatureCard variants={featureCardVariants}
                        icon={<CheckCircle2 className="h-6 w-6 text-green-500" />}
                        title="ATS Friendly"
                        description="Templates designed to be parsed perfectly by Applicant Tracking Systems."
                    />
                    <FeatureCard variants={featureCardVariants}
                        icon={<LayoutTemplate className="h-6 w-6 text-blue-500" />}
                        title="Modern Templates"
                        description="Choose from a growing library of professional, modern, and creative templates."
                    />
                    <FeatureCard variants={featureCardVariants}
                        icon={<ShieldCheck className="h-6 w-6 text-purple-500" />}
                        title="Privacy First"
                        description="Your data stays in your browser until you choose to save. No hidden tracking."
                    />
                    <FeatureCard variants={featureCardVariants}
                        icon={<Sparkles className="h-6 w-6 text-yellow-500" />}
                        title="AI Resume Scoring"
                        description="Get real-time feedback on your resume's completeness and impact."
                    />
                    <FeatureCard variants={featureCardVariants}
                        icon={<FileText className="h-6 w-6 text-red-500" />}
                        title="PDF Export"
                        description="Download high-quality, selectable PDFs ready for any application."
                    />
                </m.div>
            </section>
        </LazyMotion>
    );
}

function FeatureCard({ icon, title, description, variants }: { icon: React.ReactNode, title: string, description: string, variants?: any }) {
    return (
        <m.div
            variants={variants}
            whileHover={{ y: -5 }}
            className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm transition-shadow hover:shadow-md"
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/50 mb-4">
                {icon}
            </div>
            <div className="space-y-2">
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </m.div>
    );
}
