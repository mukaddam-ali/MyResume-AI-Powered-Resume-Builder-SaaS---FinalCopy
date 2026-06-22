"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useResumeStore } from "@/store/useResumeStore";

const AUTOSAVE_DELAY = 3000; // 3 seconds debounce

export function AutoSaveHandler() {
    const { user } = useAuth();
    const { syncStatus, setSyncStatus, syncToCloud, activeResumeId, resumes } = useResumeStore();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isFirstRender = useRef(true);
    const pendingSyncRef = useRef(false);

    // Watch for changes in the active resume
    const activeResume = activeResumeId ? resumes[activeResumeId] : null;

    useEffect(() => {
        // Skip first render to prevent checking on mount
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (!user || !activeResume) return;

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Mark that we have pending changes to sync
        pendingSyncRef.current = true;

        if (syncStatus === 'synced' || syncStatus === 'error') {
            setSyncStatus('idle'); // Indicate changes are pending
        }

        // Debounce sync
        timeoutRef.current = setTimeout(() => {
            pendingSyncRef.current = false;
            syncToCloud(user.id);
        }, AUTOSAVE_DELAY);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            // If there are unsaved changes when navigating away, sync immediately
            if (pendingSyncRef.current && user) {
                pendingSyncRef.current = false;
                syncToCloud(user.id);
            }
        };
    }, [activeResume, user, syncToCloud, setSyncStatus]);

    return null;
}
