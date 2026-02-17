'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';

export default function DebugAuthPage() {
    const [clientSession, setClientSession] = useState<any>(null);
    const [serverCheck, setServerCheck] = useState<any>(null);

    useEffect(() => {
        const checkAuth = async () => {
            // Check client-side
            const supabase = createBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();
            setClientSession(session);

            // Check server-side
            const res = await fetch('/api/admin/feedback');
            const serverData = await res.json();
            setServerCheck({ status: res.status, data: serverData });
        };

        checkAuth();
    }, []);

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>

            <div className="space-y-4">
                <div className="border p-4 rounded">
                    <h2 className="font-bold">Client Session:</h2>
                    <pre className="text-xs overflow-auto">
                        {JSON.stringify(clientSession, null, 2)}
                    </pre>
                </div>

                <div className="border p-4 rounded">
                    <h2 className="font-bold">Server Check:</h2>
                    <pre className="text-xs overflow-auto">
                        {JSON.stringify(serverCheck, null, 2)}
                    </pre>
                </div>

                <div className="border p-4 rounded bg-yellow-50">
                    <h2 className="font-bold">What to look for:</h2>
                    <ul className="list-disc ml-4 text-sm">
                        <li>Client Session should have user.email = "alialmoukaddam@gmail.com"</li>
                        <li>Server Check status should be 200 (not 401)</li>
                        <li>If client shows session but server returns 401, cookies aren't syncing</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
