"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, FileText, Sparkles, Zap, LayoutTemplate, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { TemplateGallery } from "@/components/home/TemplateGallery";

export default function Home() {
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
    <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 flex flex-col min-h-screen">
      {/* Hero Section */}
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

      {/* Features Grid */}
      <section id="features" className="w-full space-y-16 py-24 md:py-32">
        <div className="mx-auto max-w-[58rem] text-center">
          <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">
            Everything you need to get the job
          </h2>
          <p className="mt-4 text-muted-foreground sm:text-lg">
            Built by engineers, for engineers. Our templates are designed to pass ATS filters and impress human recruiters.
          </p>
        </div>

        <motion.div
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
        </motion.div>
      </section>

      {/* Community Templates Gallery */}
      <TemplateGallery />

      {/* CTA Section */}
      <section className="py-20">
        <div className="w-full px-4 md:px-6 mx-auto">
          <div className="rounded-3xl bg-slate-900 px-6 py-16 dark:bg-secondary md:px-12 lg:px-24">
            <div className="mx-auto flex max-w-[800px] flex-col items-center justify-center space-y-4 text-center text-white dark:text-primary-foreground">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-white dark:text-white">
                Ready to land your dream job?
              </h2>
              <p className="max-w-[600px] text-gray-300 dark:text-gray-300 md:text-xl">
                Join thousands of students and professionals building their future with MyResume.
              </p>
              <Link href="/editor" className="pt-4">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 dark:bg-primary dark:text-white dark:hover:bg-primary/90 font-semibold h-12 px-8">
                  Create My Resume
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, variants }: { icon: React.ReactNode, title: string, description: string, variants?: any }) {
  return (
    <motion.div
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
    </motion.div>
  );
}
