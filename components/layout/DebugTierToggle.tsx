"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Shield, ShieldAlert } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";

export function DebugTierToggle() {
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
