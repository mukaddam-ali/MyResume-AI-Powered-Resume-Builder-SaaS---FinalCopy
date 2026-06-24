"use client";

import { ResumeData } from "@/store/useResumeStore";
import { DownloadResumeButton } from "@/components/preview/DownloadResumeButton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Edit, Trash2, Copy, FileText, Calendar, Eye } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import LiveResume to avoid SSR/hydration issues
const LiveResume = dynamic(() => import("@/components/preview/LiveResume"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-muted/20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    ),
});

interface ResumeCardProps {
    resume: ResumeData;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onEdit: (id: string) => void;
}

export function ResumeCard({ resume, onDelete, onDuplicate, onEdit }: ResumeCardProps) {
    const lastModified = new Date(resume.lastModified);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.55);

    useEffect(() => {
        if (!isPreviewOpen) return;

        const updateScale = () => {
            const container = containerRef.current;
            if (!container) return;

            // Compute available viewport size minus padding (48px horizontal, 48px vertical)
            const containerWidth = container.clientWidth - 48;
            const containerHeight = container.clientHeight - 48;

            // Calculate scale factors to fit width and height of 794x1123 document
            const scaleX = containerWidth / 794;
            const scaleY = containerHeight / 1123;

            // Fit completely without scrolling (take the smaller factor)
            const newScale = Math.min(scaleX, scaleY, 0.9);
            setScale(Math.max(newScale, 0.2));
        };

        // Initial update
        updateScale();

        // Observe size changes
        const observer = new ResizeObserver(updateScale);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [isPreviewOpen]);

    const handleDelete = () => {
        onDelete(resume.id);
        setIsDeleteDialogOpen(false);
    };

    return (
        <>
            <Card className="flex flex-col sm:flex-row w-full hover:shadow-lg transition-shadow duration-300 overflow-hidden sm:h-[280px]">
                {/* Left section: Metadata and Actions */}
                <div className="flex-1 flex flex-col justify-between p-5">
                    <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-foreground line-clamp-1" title={resume.name}>
                                    {resume.name}
                                </h3>
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                    {resume.selectedTemplate} template
                                </span>
                            </div>
                            <div className="bg-primary/10 p-1.5 rounded-full hidden sm:block shrink-0">
                                <FileText className="h-4.5 w-4.5 text-primary" />
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1.5">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Edited {formatDistanceToNow(lastModified, { addSuffix: true })}</span>
                            </div>
                            {resume.personalInfo.fullName && (
                                <p className="font-medium text-foreground/80 line-clamp-1">
                                    Name: <span className="font-semibold text-foreground">{resume.personalInfo.fullName}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border">
                        <Button variant="default" size="sm" className="flex-1 min-w-[100px] h-9" onClick={() => onEdit(resume.id)}>
                            <Edit className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                        </Button>

                        <Button variant="outline" size="icon" onClick={() => onDuplicate(resume.id)} title="Duplicate" className="h-9 w-9 shrink-0">
                            <Copy className="h-3.5 w-3.5" />
                        </Button>

                        <div className="flex items-center shrink-0">
                            <DownloadResumeButton
                                data={resume}
                                fileName={`${resume.name.replace(/\s+/g, '_')}.pdf`}
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 p-0"
                            />
                        </div>

                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive" size="icon" title="Delete" className="h-9 w-9 shrink-0">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Resume?</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete "{resume.name}"? This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                                    <Button variant="destructive" onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                        Delete
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Right section: Live scaled-down preview of the resume */}
                <div 
                    className="relative w-full sm:w-[240px] h-[200px] sm:h-full bg-slate-50 dark:bg-zinc-900/30 overflow-hidden border-t sm:border-t-0 sm:border-l border-border flex items-center justify-center shrink-0 group cursor-pointer"
                    onClick={() => onEdit(resume.id)}
                >
                    {/* Hover overlay with Edit / Preview action buttons */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 dark:group-hover:bg-black/40 transition-all duration-300 z-10 flex items-center justify-center gap-3">
                        <span className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all duration-300 flex items-center gap-1.5 hover:bg-primary/95">
                            <Edit className="h-3.5 w-3.5" /> Edit
                        </span>
                        
                        <Button 
                            variant="secondary" 
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 shadow-md transition-all duration-300 gap-1.5 z-20"
                            onClick={(e) => {
                                e.stopPropagation(); // prevent edit page redirect
                                setIsPreviewOpen(true);
                            }}
                        >
                            <Eye className="h-3.5 w-3.5" /> Preview
                        </Button>
                    </div>

                    {/* Scaled resume wrapper - layout-footprint scaling for row layout */}
                    <div 
                        style={{
                            width: `${794 * 0.23}px`,
                            height: `${1123 * 0.23}px`,
                            position: "relative",
                            overflow: "hidden"
                        }}
                        className="shadow-sm border border-border/60 bg-white select-none pointer-events-none shrink-0"
                    >
                        <div
                            style={{
                                transform: "scale(0.23)",
                                transformOrigin: "top left",
                                width: "794px",
                                height: "1123px",
                                position: "absolute",
                                left: 0,
                                top: 0,
                            }}
                        >
                            <LiveResume data={resume} scale={1} />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Quick Preview Dialog declared outside Card to bypass Portal event bubbling onClick edit redirect */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-3xl sm:max-w-3xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
                    <DialogHeader className="px-6 py-4 border-b shrink-0 flex flex-row items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold">{resume.name}</DialogTitle>
                            <DialogDescription className="capitalize mt-1">
                                {resume.selectedTemplate} Template
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <div 
                        ref={containerRef}
                        className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-6 md:p-8"
                    >
                        <div 
                            style={{
                                width: `${794 * scale}px`,
                                height: `${1123 * scale}px`,
                                position: "relative",
                                overflow: "hidden"
                            }}
                            className="shadow-2xl rounded border bg-white dark:bg-slate-900 shrink-0"
                            onClick={(e) => {
                                // Stop clicks inside the preview content from triggering parent handlers
                                e.stopPropagation();
                            }}
                        >
                            <div
                                style={{
                                    transform: `scale(${scale})`,
                                    transformOrigin: "top left",
                                    width: "794px",
                                    height: "1123px",
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                }}
                            >
                                <LiveResume data={resume} scale={1} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t bg-muted/10 gap-2 shrink-0">
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>
                        <Button onClick={() => onEdit(resume.id)} className="gap-1.5">
                            <Edit className="h-4 w-4" /> Edit Resume
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
