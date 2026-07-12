"use client";

import { useEffect, useRef } from "react";
import { ResumeData } from "@/store/useResumeStore";

interface HeatmapOverlayProps {
    resumeData: ResumeData;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

interface HeatZone {
    top: number;
    left: number;
    width: number;
    height: number;
    intensity: number; // 0 = cold, 1 = hot
    label: string;
}

/**
 * Heuristic "recruiter eye-tracking" heatmap overlay.
 *
 * Zones and their heat values are derived from published research on
 * recruiter resume-scanning behaviour (Ladders Inc., 2012 eye-tracking study):
 *   - Name / headline      → HOTTEST  (first fixation, top-center)
 *   - Most recent job      → HOT      (top-left of body)
 *   - Dates / company      → WARM     (right rail)
 *   - Section headings     → MEDIUM
 *   - Dense body text      → COOL
 *   - Footer / branding    → COLD
 *
 * Instead of real DOM measurement (which would require a mounted iframe),
 * we build a conceptual heat-zone map based on the resume's *content*
 * density and project it as an absolute color overlay on top of the preview
 * container.
 */
export function HeatmapOverlay({ resumeData, containerRef }: HeatmapOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const W = container.clientWidth;
        const H = container.clientHeight;
        canvas.width = W;
        canvas.height = H;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, W, H);

        // Darken the document background slightly so heatmap colors glow with high contrast
        ctx.fillStyle = "rgba(15, 23, 42, 0.45)"; // Slate-900 at 45% opacity
        ctx.fillRect(0, 0, W, H);

        const { personalInfo, experience, education, projects, skills } = resumeData;

        // Build heuristic zones.
        // Percentages are relative to total document height (794 × 1123 pt ≈ 70/30 aspect).
        const zones: HeatZone[] = [];

        // ─── HEADER ZONE (top ~12%) ───────────────────────────────────────────────
        // Full name → ultra-hot
        if (personalInfo?.fullName) {
            zones.push({ top: 0, left: 0.1, width: 0.8, height: 0.07, intensity: 1.0, label: "Name" });
        }
        // Job title / contact bar → hot
        if (personalInfo?.jobTitle || personalInfo?.email) {
            zones.push({ top: 0.06, left: 0.05, width: 0.9, height: 0.05, intensity: 0.78, label: "Title / Contact" });
        }
        // Summary paragraph → warm–medium
        if (personalInfo?.summary) {
            const density = Math.min(personalInfo.summary.length / 400, 1);
            zones.push({ top: 0.11, left: 0.05, width: 0.9, height: 0.08, intensity: 0.55 - density * 0.15, label: "Summary" });
        }

        // ─── EXPERIENCE SECTION ───────────────────────────────────────────────────
        if (experience && experience.length > 0) {
            // Section heading
            zones.push({ top: 0.21, left: 0.03, width: 0.5, height: 0.025, intensity: 0.65, label: "Experience header" });

            experience.forEach((exp, i) => {
                const yStart = 0.24 + i * 0.13;
                if (yStart > 0.9) return;

                // Role title → hot (recruiters scan titles first)
                zones.push({ top: yStart, left: 0.03, width: 0.55, height: 0.025, intensity: 0.85 - i * 0.08, label: `Role: ${exp.role}` });
                // Company + dates → warm
                zones.push({ top: yStart + 0.025, left: 0.03, width: 0.7, height: 0.02, intensity: 0.6, label: `Company: ${exp.company}` });
                // Description → cooler based on density
                if (exp.description) {
                    const density = Math.min(exp.description.length / 500, 1);
                    // Check if description has numbers (metrics) → boosts heat
                    const hasMetrics = /\d+/.test(exp.description);
                    zones.push({
                        top: yStart + 0.048,
                        left: 0.03,
                        width: 0.9,
                        height: 0.075,
                        intensity: hasMetrics ? 0.55 : 0.3 - density * 0.1,
                        label: hasMetrics ? "Metrics-rich bullets 🔥" : "Description (add metrics!)"
                    });
                }
            });
        }

        // ─── EDUCATION SECTION ────────────────────────────────────────────────────
        if (education && education.length > 0) {
            const eduStart = Math.min(0.25 + (experience?.length || 0) * 0.13, 0.7);
            zones.push({ top: eduStart, left: 0.03, width: 0.4, height: 0.025, intensity: 0.55, label: "Education header" });
            education.forEach((edu, i) => {
                zones.push({ top: eduStart + 0.03 + i * 0.07, left: 0.03, width: 0.8, height: 0.04, intensity: 0.45, label: edu.school });
            });
        }

        // ─── SKILLS SECTION ───────────────────────────────────────────────────────
        if (skills && skills.length > 0) {
            const skillsStart = Math.min(0.3 + (experience?.length || 0) * 0.13 + (education?.length || 0) * 0.07, 0.8);
            zones.push({ top: skillsStart, left: 0.03, width: 0.3, height: 0.025, intensity: 0.5, label: "Skills header" });
            zones.push({ top: skillsStart + 0.03, left: 0.03, width: 0.9, height: 0.04, intensity: 0.4, label: "Skills list" });
        }

        // ─── DRAW HEATMAP ─────────────────────────────────────────────────────────
        zones.forEach(zone => {
            const x = zone.left * W;
            const y = zone.top * H;
            const w = zone.width * W;
            const h = zone.height * H;
            const cx = x + w / 2;
            const cy = y + h / 2;
            const r = Math.max(w, h) * 0.9;

            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);

            // Color mapping: intensity 1 → red, 0.7 → orange, 0.5 → yellow, 0.3 → cyan, 0 → blue
            const hotColor = zone.intensity > 0.85
                ? `rgba(239, 68, 68, 0.88)`   // red
                : zone.intensity > 0.65
                    ? `rgba(249, 115, 22, 0.82)` // orange
                    : zone.intensity > 0.48
                        ? `rgba(234, 179, 8, 0.78)` // yellow
                        : zone.intensity > 0.3
                            ? `rgba(34, 211, 238, 0.68)` // cyan
                            : `rgba(59, 130, 246, 0.58)`; // blue

            gradient.addColorStop(0, hotColor);
            gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, w, h);
        });

        // ─── LEGEND ───────────────────────────────────────────────────────────────
        const legendItems = [
            { color: "rgba(239, 68, 68, 0.88)", label: "Hottest — first fixation" },
            { color: "rgba(249, 115, 22, 0.82)", label: "Hot — role / title scan" },
            { color: "rgba(234, 179, 8, 0.78)", label: "Warm — metrics & numbers" },
            { color: "rgba(34, 211, 238, 0.68)", label: "Cool — supporting text" },
            { color: "rgba(59, 130, 246, 0.58)", label: "Cold — dense paragraphs" },
        ];

        const lx = W - 185;
        const ly = H - (legendItems.length * 22 + 16);

        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.roundRect(lx - 8, ly - 8, 193, legendItems.length * 22 + 20, 8);
        ctx.fill();

        legendItems.forEach((item, i) => {
            const itemY = ly + i * 22 + 4;
            ctx.fillStyle = item.color;
            ctx.roundRect(lx, itemY, 12, 12, 3);
            ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.font = "10px -apple-system, sans-serif";
            ctx.fillText(item.label, lx + 18, itemY + 9);
        });

    }, [resumeData, containerRef]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ mixBlendMode: "screen" }}
            aria-hidden="true"
        />
    );
}
