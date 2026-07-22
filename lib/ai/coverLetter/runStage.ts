import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

const MODEL = "llama-3.3-70b-versatile";

export interface StageCallOptions {
    system: string;
    prompt: string;
    temperature: number;
    maxTokens: number;
    timeoutMs: number;
    /** Date.now()-based absolute deadline for the whole pipeline — bounds every attempt regardless of per-stage timeoutMs. */
    deadline: number;
}

/**
 * One Groq call, aborted if it runs past either its own timeout or the
 * shared pipeline deadline (whichever comes first).
 */
export async function callGroqStage(opts: StageCallOptions): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured.");

    const remaining = opts.deadline - Date.now();
    if (remaining <= 0) throw new Error("Pipeline deadline exceeded.");
    const timeout = Math.max(1000, Math.min(opts.timeoutMs, remaining));

    const groq = createGroq({ apiKey });
    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), timeout);
    try {
        const { text } = await generateText({
            model: groq(MODEL),
            system: opts.system,
            prompt: opts.prompt,
            temperature: opts.temperature,
            maxTokens: opts.maxTokens,
            abortSignal: abortController.signal,
        } as any);
        return text;
    } catch (err: any) {
        if (err?.name === "AbortError" || err?.message?.includes("abort")) {
            throw new Error(`Stage timed out.`);
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Runs `attempt` once, retries once (short fixed backoff) on any error thrown
 * from it — a Groq call failure/timeout, or a JSON parse/validation failure
 * the caller throws from inside `attempt`. Bounded by the shared deadline:
 * once it's passed, the original error is rethrown immediately instead of
 * spending time on a retry that can't finish either.
 */
export async function runStageWithRetry<T>(
    stageName: string,
    deadline: number,
    attempt: () => Promise<T>
): Promise<T> {
    try {
        return await attempt();
    } catch (err) {
        if (Date.now() >= deadline) throw err;
        console.warn(
            `[cover-letter] stage "${stageName}" failed, retrying once:`,
            err instanceof Error ? err.message : err
        );
        await new Promise((r) => setTimeout(r, 400));
        return await attempt();
    }
}
