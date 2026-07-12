"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, ChevronRight, Check, X, TrendingUp, RotateCcw } from "lucide-react";

interface Question {
    id: string;
    question: string;
    hint: string;
}

interface MetricsUpgradeModalProps {
    open: boolean;
    onClose: () => void;
    description: string;
    onAccept: (upgraded: string) => void;
}

type Phase = "loading-questions" | "questions" | "loading-rewrite" | "result" | "error";

export function MetricsUpgradeModal({ open, onClose, description, onAccept }: MetricsUpgradeModalProps) {
    const [phase, setPhase] = useState<Phase>("loading-questions");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [upgraded, setUpgraded] = useState<string>("");
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (open) {
            fetchQuestions();
        } else {
            // Reset state when closed
            setPhase("loading-questions");
            setQuestions([]);
            setAnswers({});
            setUpgraded("");
            setError("");
        }
    }, [open]);

    // Fetch questions when modal opens
    const fetchQuestions = async () => {
        setPhase("loading-questions");
        setError("");
        try {
            const res = await fetch("/api/ai/upgrade-metrics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description, phase: "questions" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to analyze description.");
            setQuestions(data.questions || []);
            setAnswers({});
            setPhase("questions");
        } catch (e: any) {
            setError(e.message);
            setPhase("error");
        }
    };

    const handleRewrite = async () => {
        setPhase("loading-rewrite");
        setError("");
        try {
            // Build answers keyed by question text
            const answersMap: Record<string, string> = {};
            questions.forEach(q => {
                if (answers[q.id]) {
                    answersMap[q.question] = answers[q.id];
                }
            });

            const res = await fetch("/api/ai/upgrade-metrics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description, answers: answersMap, phase: "rewrite" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to rewrite description.");
            setUpgraded(data.upgraded || "");
            setPhase("result");
        } catch (e: any) {
            setError(e.message);
            setPhase("error");
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            fetchQuestions();
        } else {
            // Reset state
            setPhase("loading-questions");
            setQuestions([]);
            setAnswers({});
            setUpgraded("");
            setError("");
            onClose();
        }
    };

    const handleAccept = () => {
        onAccept(upgraded);
        handleOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        AI Metrics Upgrader
                    </DialogTitle>
                    <DialogDescription>
                        Transform vague responsibilities into measurable, impact-driven achievements.
                    </DialogDescription>
                </DialogHeader>

                {/* Phase: Loading Questions */}
                {phase === "loading-questions" && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                        <p className="text-sm text-muted-foreground">Analyzing your description...</p>
                    </div>
                )}

                {/* Phase: Questions */}
                {phase === "questions" && (
                    <div className="space-y-5">
                        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50">
                            <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                                💡 Answer these questions to help the AI add real impact metrics to your bullet points.
                                Even rough estimates work great!
                            </p>
                        </div>

                        {questions.map((q, i) => (
                            <div key={q.id} className="space-y-2">
                                <Label className="flex items-start gap-2 text-sm font-medium">
                                    <span className="shrink-0 w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">
                                        {i + 1}
                                    </span>
                                    {q.question}
                                </Label>
                                <Input
                                    placeholder={q.hint}
                                    value={answers[q.id] || ""}
                                    onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    className="ml-7"
                                    onKeyDown={(e) => e.key === "Enter" && handleRewrite()}
                                />
                            </div>
                        ))}

                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={() => handleOpenChange(false)} className="gap-1.5">
                                <X className="w-3.5 h-3.5" /> Cancel
                            </Button>
                            <Button
                                onClick={handleRewrite}
                                disabled={Object.keys(answers).length === 0}
                                className="flex-1 gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                            >
                                <Sparkles className="w-4 h-4" />
                                Upgrade My Bullets
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Phase: Loading Rewrite */}
                {phase === "loading-rewrite" && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="relative">
                            <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                            <Sparkles className="w-4 h-4 text-indigo-500 absolute -top-1 -right-1 animate-pulse" />
                        </div>
                        <p className="text-sm text-muted-foreground">Crafting your impact bullets...</p>
                        <p className="text-xs text-muted-foreground/70">Powered by Llama 3.3</p>
                    </div>
                )}

                {/* Phase: Result */}
                {phase === "result" && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                ✨ Upgraded Description
                            </p>
                            <div className="p-4 rounded-xl border bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200/60 dark:border-purple-800/40">
                                <pre className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                                    {upgraded}
                                </pre>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                ⚡ Review the upgraded bullets above. You can refine them further in the editor after accepting.
                            </p>
                        </div>

                        <div className="flex gap-2 pt-1">
                            <Button
                                variant="outline"
                                onClick={() => setPhase("questions")}
                                className="gap-1.5 text-xs"
                            >
                                <RotateCcw className="w-3 h-3" /> Try Again
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                className="gap-1.5 text-xs"
                            >
                                <X className="w-3 h-3" /> Discard
                            </Button>
                            <Button
                                onClick={handleAccept}
                                className="flex-1 gap-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                            >
                                <Check className="w-4 h-4" />
                                Accept & Apply
                            </Button>
                        </div>
                    </div>
                )}

                {/* Phase: Error */}
                {phase === "error" && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-sm text-red-700 dark:text-red-300">
                            {error || "Something went wrong. Please try again."}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => handleOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button onClick={fetchQuestions} className="gap-1.5">
                                <RotateCcw className="w-3.5 h-3.5" /> Try Again
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
