"use client";

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, FileText, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function UserMenu() {
    const { user, signOut, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />;
    }

    if (!user) {
        return (
            <Link href="/auth/login">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Sign In
                </Button>
            </Link>
        );
    }

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    const handleReset = () => {
        if (typeof window !== 'undefined' && window.confirm("WARNING: This will delete ALL locally saved resumes. This cannot be undone. Are you sure?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    // Get user initials for avatar
    const userEmail = user.email || '';
    const initials = userEmail
        .split('@')[0]
        .split('.')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-9 w-9 !rounded-full aspect-square p-0 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    <span className="text-sm font-semibold">{initials}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {user.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {userEmail}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>My Resumes</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleReset} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Reset App Data</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-muted-foreground">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
