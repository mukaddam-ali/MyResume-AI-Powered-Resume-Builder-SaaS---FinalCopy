"use client";

import { useEffect, useState } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { ResumeCard } from "@/components/dashboard/ResumeCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";

export default function DashboardPage() {
    const { resumes, addResume, deleteResume, duplicateResume, setActiveResume, loadFromCloud } = useResumeStore();
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Initial load logic
    useEffect(() => {
        if (!loading && user) {
            const fetchData = async () => {
                setIsLoadingData(true);
                await loadFromCloud(user.id);
                setIsLoadingData(false);
            };
            fetchData();
        }
    }, [user, loading, loadFromCloud]);

    const handleCreateResume = () => {
        const name = `My Resume ${new Date().toLocaleDateString()}`;
        addResume(name);
        router.push("/editor");
    };

    const handleEditResume = (id: string) => {
        setActiveResume(id);
        router.push("/editor");
    };

    const handleDeleteResume = async (id: string) => {
        await deleteResume(id);
    };

    const handleDuplicateResume = (id: string) => {
        duplicateResume(id);
    };

    const resumeList = Object.values(resumes).sort((a, b) => b.lastModified - a.lastModified);

    if (loading || isLoadingData) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto w-full max-w-screen-2xl py-8 px-4 sm:px-6 lg:px-8 space-y-8">
            {/* User Profile Section */}
            {user && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6"
                >
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold shrink-0">
                        {user.user_metadata?.full_name
                            ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                            : user.email?.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 space-y-1">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <h2 className="text-2xl font-bold text-foreground">
                                {user.user_metadata?.full_name || 'Guest User'}
                            </h2>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                Pro Plan
                            </span>
                        </div>
                        <p className="text-muted-foreground">{user.email}</p>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">Joined:</span>
                                {new Date(user.created_at!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">Resumes Created:</span>
                                {Object.keys(resumes).length}
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:block border-l border-border pl-8 py-2">
                        <div className="text-center">
                            <span className="block text-3xl font-bold text-primary">{Object.keys(resumes).length}</span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Resumes</span>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">My Resumes</h1>
                    <p className="text-muted-foreground mt-1">
                        Create, edit, and manage your professional resumes.
                    </p>
                </div>
                <Button onClick={handleCreateResume} size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all">
                    <Plus className="mr-2 h-5 w-5" />
                    Create New Resume
                </Button>
            </div>

            {resumeList.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-xl bg-muted/30">
                    <h3 className="text-xl font-semibold mb-2 text-foreground">No resumes found</h3>
                    <p className="text-muted-foreground mb-6">Get started by creating your first resume!</p>
                    <Button onClick={handleCreateResume} variant="outline">
                        Create Resume
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {resumeList.map((resume, index) => (
                        <motion.div
                            key={resume.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <ResumeCard
                                resume={resume}
                                onDelete={handleDeleteResume}
                                onDuplicate={handleDuplicateResume}
                                onEdit={handleEditResume}
                            />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
