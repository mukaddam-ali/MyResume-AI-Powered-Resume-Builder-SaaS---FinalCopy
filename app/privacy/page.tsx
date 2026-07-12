import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Privacy Policy | MyResume",
    description: "Privacy Policy for MyResume — what we collect, how we use it, and your rights.",
};

export default function PrivacyPage() {
    return (
        <div className="container mx-auto max-w-3xl px-4 py-12 prose prose-slate dark:prose-invert">
            <h1>Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: July 8, 2026</p>

            <h2>What we collect</h2>
            <ul>
                <li><strong>Account data:</strong> your email and name from Google sign-in (via Supabase Auth).</li>
                <li><strong>Resume content:</strong> what you type into the editor. Without an account it stays in your browser's local storage; with an account it is also synced to our database.</li>
                <li><strong>Payment data:</strong> handled entirely by Stripe — we never see or store card numbers, only the payment reference and its status.</li>
                <li><strong>Feedback:</strong> messages you submit through the feedback widget.</li>
            </ul>

            <h2>How we use it</h2>
            <ul>
                <li>To provide the editor, cloud sync, PDF export, and portfolio pages.</li>
                <li>AI features (parsing, analysis, bullet writing, cover letters) send the relevant resume text to our AI provider (Groq) to generate the result. It is not used to train models.</li>
                <li>We do not sell your data or use it for advertising.</li>
            </ul>

            <h2>Public portfolios</h2>
            <p>
                Publishing a resume makes a sanitized version publicly visible at its share
                link and in the community template gallery. Contact details (email, phone)
                and your photo are stripped before publishing. Unpublishing removes it.
            </p>

            <h2>Data retention & deletion</h2>
            <p>
                Deleting a resume removes it from our database. To delete your entire account
                and all associated data, contact us via the feedback widget and we will
                process the deletion within 30 days.
            </p>

            <h2>Third parties</h2>
            <p>
                We rely on Supabase (auth & database), Stripe (payments), Groq (AI), and our
                hosting provider. Each processes data only as needed to provide their service.
            </p>

            <h2>Your rights</h2>
            <p>
                You can access, correct, export, or delete your data at any time — most of it
                directly in the app, the rest by contacting us. EU/UK users have the rights
                provided by GDPR.
            </p>

            <p>
                See also our <Link href="/terms">Terms of Service</Link>.
            </p>
        </div>
    );
}
