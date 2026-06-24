"use client";

import React, { useState, useEffect, useRef } from "react";

interface LazySectionProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    minHeight?: string;
}

export function LazySection({ children, fallback, minHeight = "150px" }: LazySectionProps) {
    const [shouldRender, setShouldRender] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
            setShouldRender(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldRender(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "300px" } // pre-render when within 300px of viewport
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} style={{ minHeight: shouldRender ? "auto" : minHeight }} className="w-full">
            {shouldRender ? children : fallback || null}
        </div>
    );
}
