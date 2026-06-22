"use client";

import { ResumeData } from "@/store/useResumeStore";
import { DownloadResumeButton } from "@/components/preview/DownloadResumeButton";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Edit, Trash2, Copy, FileText, Calendar } from "lucide-react";
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
import { useState } from "react";

interface ResumeCardProps {
    resume: ResumeData;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onEdit: (id: string) => void;
}

export function ResumeCard({ resume, onDelete, onDuplicate, onEdit }: ResumeCardProps) {
    const lastModified = new Date(resume.lastModified);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleDelete = () => {
        onDelete(resume.id);
        setIsDeleteDialogOpen(false);
    }

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold line-clamp-1" title={resume.name}>
                            {resume.name}
                        </CardTitle>
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                            {resume.selectedTemplate} template
                        </span>
                    </div>
                    <div className="bg-primary/10 p-2 rounded-full">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-3">
                <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Edited {formatDistanceToNow(lastModified, { addSuffix: true })}</span>
                    </div>
                    {resume.personalInfo.fullName && (
                        <p className="line-clamp-1 font-medium text-foreground/80">
                            {resume.personalInfo.fullName}
                        </p>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pt-3 border-t bg-muted/20 gap-3">
                <Button variant="default" className="flex-1" onClick={() => onEdit(resume.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </Button>

                <Button variant="outline" size="icon" onClick={() => onDuplicate(resume.id)} title="Duplicate" className="h-11 w-11">
                    <Copy className="h-4 w-4" />
                </Button>

                <div className="flex items-center">
                    <DownloadResumeButton
                        data={resume}
                        fileName={`${resume.name.replace(/\s+/g, '_')}.pdf`}
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 p-0"
                    />
                </div>

                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="destructive" size="icon" title="Delete" className="h-11 w-11">
                            <Trash2 className="h-4 w-4" />
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
            </CardFooter>
        </Card>
    );
}
