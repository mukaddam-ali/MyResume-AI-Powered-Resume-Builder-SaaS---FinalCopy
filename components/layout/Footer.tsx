import Link from "next/link";

export function Footer() {
    return (
        <footer className="w-full bg-background/80 backdrop-blur-sm border-t py-2 md:py-0">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                    Built for CS Students. © 2026 MyResume.
                </p>
                <nav className="flex items-center gap-6 text-sm text-muted-foreground">
                    <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                    <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                </nav>
            </div>
        </footer>
    );
}
