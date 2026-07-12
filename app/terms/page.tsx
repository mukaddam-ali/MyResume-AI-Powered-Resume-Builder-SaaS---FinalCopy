import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Terms of Service | MyResume",
    description: "Terms of Service for MyResume — the AI-powered resume builder.",
};

export default function TermsPage() {
    return (
        <div className="container mx-auto max-w-3xl px-4 py-12 prose prose-slate dark:prose-invert">
            <h1>Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: July 8, 2026</p>

            <h2>1. The Service</h2>
            <p>
                MyResume ("the Service") lets you create, edit, analyze, and export resumes,
                and optionally publish a public portfolio page. By using the Service you agree
                to these terms.
            </p>

            <h2>2. Your Account</h2>
            <p>
                You can use the editor without an account; cloud sync, publishing, and Pro
                features require signing in. You are responsible for activity under your
                account and for keeping your sign-in method secure.
            </p>

            <h2>3. Your Content</h2>
            <p>
                You own the content you put into your resumes. You grant us only the rights
                needed to store, process, and display it to provide the Service (including
                sending resume text to our AI providers to power analysis and writing
                features). If you make a resume public, anyone with the link can view the
                published version until you unpublish it.
            </p>

            <h2>4. Pro Purchases</h2>
            <p>
                Pro is a one-time purchase processed by Stripe and linked to your account.
                If a payment succeeds but Pro is not activated, contact support with your
                payment reference and we will resolve it. Refund requests within 14 days of
                purchase are honored if Pro features were materially unavailable.
            </p>

            <h2>5. Acceptable Use</h2>
            <p>
                Don't abuse the Service: no scraping, no automated bulk requests to AI
                features, no publishing unlawful or deceptive content, and no attempts to
                access other users' data.
            </p>

            <h2>6. AI Output</h2>
            <p>
                AI-generated suggestions, scores, and letters are assistance, not guarantees.
                Review everything before sending it to an employer — you are responsible for
                the accuracy of your own resume.
            </p>

            <h2>7. Disclaimer & Liability</h2>
            <p>
                The Service is provided "as is" without warranties. To the maximum extent
                permitted by law, our total liability is limited to the amount you paid us in
                the 12 months before the claim.
            </p>

            <h2>8. Changes</h2>
            <p>
                We may update these terms; material changes will be announced on the site.
                Continued use after changes means you accept them.
            </p>

            <p>
                Questions? See our <Link href="/privacy">Privacy Policy</Link> or contact us
                via the feedback widget.
            </p>
        </div>
    );
}
