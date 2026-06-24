'use client';

import { useState } from 'react';
import { MessageSquare, X, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

export function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [rating, setRating] = useState(0);
    const [category, setCategory] = useState('issue');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');

    // Helper to reset form
    const resetForm = () => {
        setRating(0);
        setCategory('issue');
        setMessage('');
        setEmail('');
        setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category,
                    rating,
                    message,
                    email: email || undefined, // Send if provided
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to submit: ${res.statusText}`);
            }

            setSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setTimeout(resetForm, 300); // Reset after closing animation
            }, 2000);
        } catch (err: any) {
            console.error(err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        size="icon"
                        className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <MessageSquare className="h-6 w-6" />
                        <span className="sr-only">Feedback</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 mr-4 mb-2 p-0 overflow-hidden" side="top" align="end">
                    <div className="bg-primary px-4 py-3 flex justify-between items-center text-primary-foreground">
                        <p className="font-semibold">Send Feedback</p>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="p-4">
                        {success ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
                                <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                    <Star className="h-6 w-6 fill-current" />
                                </div>
                                <p className="font-medium text-lg">Thank You!</p>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Your feedback helps us improve.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>How would you rate your experience?</Label>
                                    <div className="flex justify-between px-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className={cn(
                                                    "transition-all duration-200 hover:scale-110 focus:outline-none",
                                                    rating >= star ? "text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-400/50"
                                                )}
                                            >
                                                <Star className={cn("h-6 w-6", rating >= star && "fill-current")} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="issue">Report an Issue</SelectItem>
                                            <SelectItem value="idea">Feature Request</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Tell us what you think..."
                                        className="min-h-[80px] resize-none"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email (optional)</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="contact@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={loading || !message || rating === 0}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Submit Feedback'
                                    )}
                                </Button>
                            </form>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
