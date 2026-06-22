import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TemplateGallery } from "@/components/home/TemplateGallery";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 flex flex-col min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Grid */}
      <FeaturesSection />

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

      <FeedbackWidget />
    </div>
  );
}
