'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Star, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Feedback {
    id: string;
    user_id: string | null;
    message: string;
    category: string;
    rating: number;
    email: string | null;
    created_at: string;
}

export default function AdminFeedbackPage() {
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            const res = await fetch('/api/admin/feedback');
            if (res.status === 401) {
                setError('Unauthorized. Please log in.');
                setLoading(false);
                return;
            }
            if (res.status === 403) {
                setError('Access Denied. You are not an admin.');
                setLoading(false);
                return;
            }
            if (!res.ok) throw new Error('Failed to fetch');

            const data = await res.json();
            console.log('📊 Feedback data received:', data);
            console.log('📊 Number of feedback items:', data.feedback?.length);
            setFeedback(data.feedback);
        } catch (err) {
            setError('Failed to load feedback');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this feedback? You won\'t be able to restore it.')) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/feedback?id=${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Failed to delete');
            }

            // Refresh the feedback list
            await fetchFeedback();
        } catch (err) {
            console.error('Error deleting feedback:', err);
            alert('Failed to delete feedback. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <h1 className="text-2xl font-bold text-destructive">{error}</h1>
                <button
                    onClick={() => router.push('/')}
                    className="text-primary hover:underline"
                >
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <Card>
                <CardHeader>
                    <CardTitle>User Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="w-[40%]">Message</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {feedback.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        No feedback yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                feedback.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            {format(new Date(item.created_at), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                {item.rating} <Star className="h-3 w-3 ml-1 fill-current text-yellow-500" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={item.category === 'issue' ? 'destructive' : 'secondary'}>
                                                {item.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">
                                                    {item.message.split(' ').slice(0, 4).join(' ')}
                                                    {item.message.split(' ').length > 4 && '...'}
                                                </span>
                                                {item.message.split(' ').length > 4 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="shrink-0 h-6 px-2 text-xs hover:bg-primary/10"
                                                        onClick={() => setSelectedMessage(item.message)}
                                                    >
                                                        Open
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.email || (item.user_id ? 'Registered User' : 'Anonymous')}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(item.id)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Message Tooltip Bubble */}
            {selectedMessage && (
                <div
                    className="fixed inset-0 z-50"
                    onClick={() => setSelectedMessage(null)}
                >
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-popover text-popover-foreground rounded-lg shadow-lg border p-4 max-w-md min-w-[300px] animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="whitespace-pre-wrap text-sm break-words">
                            {selectedMessage}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
