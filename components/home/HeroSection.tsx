"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function HeroSection() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 } as any
        }
    };

    return (
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-32 lg:pb-28">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-background to-background" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full flex flex-col items-center text-center gap-8"
            >
                <motion.div variants={itemVariants} className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    <Sparkles className="mr-2 h-4 w-4 text-primary" />
                    <span>v2.0 Now Live with Active Design</span>
                </motion.div>

                <motion.h1 variants={itemVariants} className="text-4xl font-extrabold tracking-tight lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                    Build a Resume That <br />
                    <span className="text-primary">Gets You Hired.</span>
                </motion.h1>

                <motion.p variants={itemVariants} className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                    Create ATS-friendly, professionally designed resumes in minutes.
                    Real-time preview, AI scoring, and instant PDF export.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 min-w-[200px]">
                    <Link href="/editor">
                        <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-white gap-2 w-full sm:w-auto shadow-xl shadow-blue-500/20 transition-all hover:scale-105 font-semibold rounded-full">
                            Build My Resume <ArrowRight className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Link href="#features">
                        <Button variant="outline" size="lg" className="h-14 px-8 text-lg w-full sm:w-auto rounded-full backdrop-blur-sm bg-background/50">
                            View Templates
                        </Button>
                    </Link>
                </motion.div>

                {/* Floating Preview Element */}
                <motion.div
                    initial={{ y: 40, opacity: 0, rotateX: 20 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
                    className="mt-16 relative w-full max-w-5xl mx-auto p-2 bg-gradient-to-b from-border to-transparent rounded-xl"
                >
                    <div className="rounded-lg overflow-hidden shadow-2xl border bg-background/50 backdrop-blur">
                        <div className="h-8 bg-muted/50 border-b flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                        <div className="p-8 grid md:grid-cols-2 gap-8 items-center bg-background">
                            <div className="space-y-4 text-left">
                                <div className="h-8 w-3/4 bg-primary/10 rounded animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-muted rounded" />
                                    <div className="h-4 w-5/6 bg-muted rounded" />
                                    <div className="h-4 w-4/6 bg-muted rounded" />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <div className="h-20 w-full bg-muted/30 rounded border border-dashed" />
                                    <div className="h-20 w-full bg-muted/30 rounded border border-dashed" />
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-25" />
                                <div className="relative bg-white dark:bg-slate-900 border rounded-lg p-6 shadow-sm">
                                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                                        <div>
                                            <div className="h-6 w-32 bg-slate-800 dark:bg-slate-200 rounded mb-2" />
                                            <div className="h-3 w-24 bg-slate-400 rounded" />
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex gap-3">
                                                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                                                    <div className="h-3 w-5/6 bg-slate-100 dark:bg-slate-800 rounded" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
}
