"use client";

import Link from "next/link";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { FileText } from "lucide-react";
import dynamic from "next/dynamic";

const UpgradeButton = dynamic(() => import("@/components/payment/UpgradeButton"), {
    ssr: false,
});

const UserMenu = dynamic(() => import("@/components/auth/UserMenu").then((m) => m.UserMenu), {
    ssr: false,
    loading: () => <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />,
});

const DebugTierToggle = dynamic(() => import("./DebugTierToggle").then((m) => m.DebugTierToggle), {
    ssr: false,
});

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full px-4 sm:px-8 lg:px-12 flex h-14 items-center">
                <Link href="/" className="flex items-center space-x-2 mr-6 pl-3" aria-label="MyResume home">
                    <FileText className="h-6 w-6 text-foreground" aria-hidden="true" />
                    <span className="hidden font-bold sm:inline-block">
                        MyResume
                    </span>
                </Link>
                <div className="flex flex-1 items-center justify-end space-x-2">
                    <UpgradeButton size="sm" />
                    <DebugTierToggle />
                    <nav className="flex items-center space-x-4">
                        <ModeToggle />
                        <UserMenu />
                    </nav>
                </div>
            </div>
        </header>
    );
}

