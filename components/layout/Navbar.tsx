"use client";

import Link from "next/link";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { FileText } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { Button } from "@/components/ui/button";
import { useResumeStore } from "@/store/useResumeStore";
import { Shield, ShieldAlert } from "lucide-react";
import UpgradeButton from "@/components/payment/UpgradeButton";


export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full px-4 sm:px-8 lg:px-12 flex h-14 items-center">
                <Link href="/" className="flex items-center space-x-2 mr-6">
                    <FileText className="h-6 w-6 text-foreground" />
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

function DebugTierToggle() {
    const { userTier, setUserTier } = useResumeStore();

    const toggleTier = () => {
        const newTier = userTier === 'free' ? 'pro' : 'free';
        setUserTier(newTier);
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={toggleTier}
            className={`mr-2 h-8 text-xs gap-1.5 ${userTier === 'pro'
                ? "bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 border-yellow-500 font-bold dark:from-amber-400 dark:to-yellow-500 dark:text-black"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            title="Debug: Toggle User Tier"
        >
            {userTier === 'pro' ? <Shield className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
            <span className="hidden xs:inline sm:hidden">
                {userTier === 'pro' ? "PRO" : "FREE"}
            </span>
            <span className="hidden sm:inline md:hidden">
                {userTier === 'pro' ? "PRO" : "FREE"}
            </span>
            <span className="hidden md:inline">
                {userTier === 'pro' ? "PRO ACCOUNT" : "FREE PLAN"}
            </span>
        </Button>
    );
}

