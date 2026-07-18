"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

/**
 * App chrome wrapper. Public portfolio pages (/p/...) are standalone sites —
 * they bring their own header/footer, so the MyResume navbar and footer are
 * hidden there (a builder-branded navbar on someone's personal portfolio
 * looks broken and unprofessional).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPortfolio = pathname?.startsWith("/p/");

    if (isPortfolio) {
        return <>{children}</>;
    }

    return (
        <>
            <Navbar />
            <div className="flex-1 flex flex-col">
                <main className="flex-1 flex flex-col">
                    {children}
                </main>
            </div>
            <Footer />
        </>
    );
}
