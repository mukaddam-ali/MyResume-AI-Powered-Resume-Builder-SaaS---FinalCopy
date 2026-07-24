import { GREENHOUSE_COMPANIES } from './companies';

export interface GreenhouseJob {
    id: number;
    title: string;
    company: string;
    location: string;
    url: string;
    updatedAt: string;
    /** Plain-text job description, stripped of HTML — used for keyword matching. */
    descriptionText: string;
}

interface RawGreenhouseJob {
    id: number;
    title: string;
    updated_at: string;
    absolute_url: string;
    location?: { name?: string };
    content?: string;
}

function stripHtml(html: string): string {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
}

/** One company's board. Never throws — a bad/renamed token just yields no jobs. */
async function fetchCompanyJobs(name: string, token: string): Promise<GreenhouseJob[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
        const res = await fetch(
            `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`,
            { signal: controller.signal }
        );
        if (!res.ok) return [];
        const data: { jobs?: RawGreenhouseJob[] } = await res.json();
        return (data.jobs || []).map((job) => ({
            id: job.id,
            title: job.title,
            company: name,
            location: job.location?.name || 'Location not specified',
            url: job.absolute_url,
            updatedAt: job.updated_at,
            descriptionText: job.content ? stripHtml(job.content) : '',
        }));
    } catch {
        return [];
    } finally {
        clearTimeout(timeout);
    }
}

let cache: { jobs: GreenhouseJob[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30 * 60_000; // 30 minutes — job boards don't churn fast enough to need fresher data

/**
 * All jobs across every configured company board, cached in-memory per
 * server instance (resets on cold start — same tradeoff as lib/rate-limit.ts).
 * Fetches every board in parallel; a single company failing doesn't block
 * the others since fetchCompanyJobs never throws.
 */
export async function getAllGreenhouseJobs(): Promise<GreenhouseJob[]> {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
        return cache.jobs;
    }
    const results = await Promise.all(
        GREENHOUSE_COMPANIES.map((c) => fetchCompanyJobs(c.name, c.token))
    );
    const jobs = results.flat();
    cache = { jobs, fetchedAt: Date.now() };
    return jobs;
}
