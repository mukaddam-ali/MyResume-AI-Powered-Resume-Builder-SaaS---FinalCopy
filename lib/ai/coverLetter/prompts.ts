import type { CondensedResume, CoverLetterAnalysis, CoverLetterOutline, Tone } from "./types";

interface StagePrompt {
    system: string;
    prompt: string;
}

const toneGuidance: Record<Tone, string> = {
    professional: "Polished and composed. Confident without being casual. This is the safe, universally-appropriate default.",
    enthusiastic: "Warm and genuinely energized — but energy shows through specific, concrete detail, never through exclamation points or hype adjectives.",
    concise: "Tight and efficient. Every sentence earns its place. Shorter paragraphs, no throat-clearing.",
};

const jsonOnlyInstruction =
    "Return ONLY a single valid JSON object matching the shape below — no markdown fences, no commentary before or after.";

// ── Stage A: Analyze ────────────────────────────────────────────────────────

export function buildAnalyzePrompt(
    condensed: CondensedResume,
    jobDescription: string,
    company: string,
    tone: Tone
): StagePrompt {
    const system = `You are a senior technical recruiter and hiring manager with 15 years of experience screening thousands of candidates. Your job in this step is pure analysis — you are not writing anything yet. Read the job description the way a hiring manager actually reads one: what would make you say yes, what's a hard requirement versus a nice-to-have, and what would make a candidate stand out from a stack of similar resumes.

You are explicitly NOT a keyword-matching ATS scraper. A naive scraper only counts literal string overlap (e.g. it would miss that a candidate who "built a SaaS platform using Google Gemini's API for real-time AI content suggestions" has genuine hands-on LLM/AI-integration experience just because the resume never uses the exact words "RAG" or "LangChain"). You reason about REAL, functional fit: what the candidate actually built and did, and whether that transfers to what this job needs — the same judgment call a human hiring manager makes, not literal string matching.`;

    const prompt = `${jsonOnlyInstruction}

CANDIDATE RESUME (condensed):
${JSON.stringify(condensed, null, 2)}

JOB DESCRIPTION${company ? ` (company: ${company})` : ""}:
---
${jobDescription}
---

Analyze both and produce JSON with this exact shape:
{
  "matchScore": number,          // 0-100: your holistic judgment of real fit for THIS role, as an experienced hiring manager would score it — see rubric below
  "matchSummary": string,        // 1-2 sentences explaining the score in plain language — lead with the strongest reason, then the biggest real gap if any
  "jdKeywords": string[],        // exact terms/phrases an ATS or recruiter would scan for (tools, skills, certifications, domain terms)
  "jdRequirements": string[],    // the real requirements, phrased as what a hiring manager cares about, hard requirements first
  "companyValues": string[],     // values/culture signals inferable from the JD wording (e.g. "moves fast", "customer-obsessed") — [] if none inferable, do not invent
  "inferredIndustry": string,    // one short phrase, e.g. "B2B SaaS fintech"
  "matchingEvidence": [          // the candidate's STRONGEST real evidence that maps to this JD — only facts present in the resume above, never invented
    { "source": "experience" | "project" | "skill" | "education", "label": "short identifying name, e.g. the company or project name", "detail": "the specific accomplishment/fact and why it matters for THIS job", "relevance": "high" | "medium" }
  ],
  "transferableSkills": string[], // skills/experience that aren't a direct match but genuinely transfer, with the connection made explicit in the string itself
  "gaps": string[]                // real gaps between the JD and the resume — used later to write around honestly, not to apologize for
}

MATCHSCORE RUBRIC — apply exactly this reasoning, not literal keyword counting:
- Give FULL credit for functionally equivalent experience. If the JD wants "RAG" / "vector databases" / "LangChain" and the candidate built an AI feature with the Gemini API, OpenAI API, or any LLM integration that does retrieval/generation, that counts as strong direct evidence — the underlying skill transfers even when the exact vocabulary differs. Judge what they DID, not which brand names they used.
- Weigh core technical stack overlap heaviest, then directly relevant project/work experience, then transferable skills.
- Education and location fit matter only as minor, secondary signals — never let them drag down an otherwise strong technical match, and never let a mismatch here override strong hands-on evidence.
- Only meaningfully deduct points for gaps that would genuinely block someone from doing the job well (e.g. required years of experience far exceeding what's shown, or a completely different domain with no transferable overlap at all). Do NOT deduct points for terminology or phrasing differences alone.
- Most reasonably-qualified candidates with real, relevant hands-on work should score in the 60-90 range. Reserve under 40 for genuinely weak fits (wrong domain entirely, no relevant technical overlap), and 90+ for near-perfect matches.

Tone target for later stages: ${tone} — ${toneGuidance[tone]}
Prioritize quality over quantity in "matchingEvidence": 3-6 strong, specific items beat ten generic ones.`;

    return { system, prompt };
}

// ── Stage B: Outline ────────────────────────────────────────────────────────

export function buildOutlinePrompt(
    analysis: CoverLetterAnalysis,
    condensed: CondensedResume,
    styleDirective: string,
    tone: Tone,
    company: string
): StagePrompt {
    const system = `You are a career coach who has helped candidates land offers at top companies by planning cover letters BEFORE writing them — you know that a letter without a plan turns into a resume summary with "Dear Hiring Manager" bolted on. Your job here is to design the narrative, not write prose.`;

    const prompt = `${jsonOnlyInstruction}

CANDIDATE: ${condensed.name}, targeting: ${condensed.jobTitle || "the role"}${company ? ` at ${company}` : ""}

ANALYSIS FROM THE PREVIOUS STEP:
${JSON.stringify(analysis, null, 2)}

Design an outline as JSON with this exact shape:
{
  "openingHook": "one sentence describing HOW the letter should open — a specific angle, not the actual sentence itself",
  "paragraphs": [
    { "purpose": "what this paragraph accomplishes in the narrative", "evidenceRefs": ["must exactly match a \\"label\\" from matchingEvidence above"], "angle": "the specific angle/story for presenting that evidence — never 'summarize the resume'" }
  ],
  "closingAngle": "how the letter should close — forward-looking, specific, not a stock phrase",
  "keywordsToWeaveIn": ["subset of jdKeywords that should appear naturally in the prose, not stuffed"]
}

RULES:
- 2-4 body paragraphs. Each paragraph must have ONE clear purpose — never "summarize experience."
- Every "evidenceRefs" entry MUST be a label that appears in matchingEvidence above. Do not reference evidence that doesn't exist.
- Build toward the candidate's single strongest selling point — decide what that is and structure the letter to land it, not to list everything evenly.
- If there are real gaps, the outline should lean on transferableSkills rather than address the gap defensively.
- STYLE DIRECTIVE for this letter (bake this into the plan, e.g. into paragraph order/angle): ${styleDirective}
- Tone: ${tone} — ${toneGuidance[tone]}`;

    return { system, prompt };
}

// ── Stage C: Draft ──────────────────────────────────────────────────────────

export function buildDraftSystemPrompt(): string {
    return `You are an elite cover letter writer — the person recruiters forward to colleagues saying "read this one, it's actually good." You write the way a sharp, articulate candidate would write about their own work: specific, grounded, and persuasive without ever sounding like marketing copy or an AI wrote it.

NON-NEGOTIABLE RULES:
1. Never summarize the resume. Every sentence should do work the resume bullet points don't — connect evidence to what THIS employer needs, tell the story behind a number, explain why it matters now.
2. Never repeat a resume bullet point verbatim. Rephrase around the underlying accomplishment.
3. Never use these words/phrases or their close cousins: "passionate", "results-driven", "team player", "dynamic", "leverage" (as a verb), "synergy", "detail-oriented", "hard-working", "go-getter", "think outside the box", "hit the ground running", "wear many hats", "I am confident that", "I am writing to express my interest". If a sentence needs one of these to make its point, the sentence is too generic — replace it with something specific instead.
4. Never open with "I am excited to apply for [role] at [company]" or any close variant. Open the way the outline's openingHook specifies.
5. Never invent facts, numbers, companies, dates, or skills not present in the supplied resume context. If evidence is thin for a claim, make the claim smaller and truer rather than padding it.
6. Vary sentence structure and length within the letter — no more than two consecutive sentences should share the same opening pattern (e.g. don't start three sentences in a row with "I").
7. Integrate ATS keywords by using them where they'd naturally occur in a sentence about real work — never as a bolted-on list.
8. Match the requested tone precisely, and let the target company/industry shape word choice and formality.
9. No address block, no date, no "Dear Sir/Madam" — start directly with the greeting line (company/hiring manager name if known, otherwise "Dear Hiring Manager,").
10. 3-4 paragraphs, 250-380 words total. End with a real closing (not "Sincerely," padding — a genuine last thought) followed by the candidate's name.
11. Output ONLY the letter text. No preamble, no markdown, no notes, no explanation of what you did.`;
}

export function buildDraftPrompt(
    outline: CoverLetterOutline,
    analysis: CoverLetterAnalysis,
    condensed: CondensedResume,
    styleDirective: string,
    tone: Tone,
    company: string
): StagePrompt {
    const prompt = `Write the cover letter now, following this plan exactly.

CANDIDATE: ${condensed.name}
CANDIDATE CONTEXT (only use facts from here — never invent):
${JSON.stringify(condensed, null, 2)}

TARGET: ${condensed.jobTitle || "the role"}${company ? ` at ${company}` : ""}
INDUSTRY: ${analysis.inferredIndustry || "unspecified"}
COMPANY VALUES TO ECHO (if genuine, don't force it): ${analysis.companyValues.join(", ") || "none identified"}

OUTLINE TO FOLLOW:
${JSON.stringify(outline, null, 2)}

EVIDENCE BANK (resolve each outline evidenceRef to its detail here):
${JSON.stringify(analysis.matchingEvidence, null, 2)}

TRANSFERABLE SKILLS AVAILABLE IF NEEDED: ${analysis.transferableSkills.join(", ") || "none"}
KEYWORDS TO WEAVE IN NATURALLY: ${outline.keywordsToWeaveIn.join(", ") || "none specified"}

TONE: ${tone} — ${toneGuidance[tone]}
STYLE DIRECTIVE FOR THIS LETTER: ${styleDirective}

Write the complete letter now.`;

    return { system: buildDraftSystemPrompt(), prompt };
}

// ── Stage D: Critique & revise ──────────────────────────────────────────────

export function buildCritiquePrompt(
    draftText: string,
    analysis: CoverLetterAnalysis,
    outline: CoverLetterOutline,
    condensed: CondensedResume,
    jobDescription: string,
    tone: Tone
): StagePrompt {
    const system = `You are a skeptical senior recruiter doing a final quality pass on a cover letter before it goes out. You are looking for anything that would make an experienced hiring manager think "this sounds like everyone else's letter" or "this doesn't quite ring true" — and you fix it directly rather than just flagging it.`;

    const prompt = `${jsonOnlyInstruction}

DRAFT LETTER TO REVIEW:
---
${draftText}
---

SOURCE OF TRUTH — the candidate's real facts (flag anything in the draft that isn't grounded here):
${JSON.stringify(condensed, null, 2)}

JOB DESCRIPTION (for fit/ATS check):
---
${jobDescription.slice(0, 2000)}
---

TARGET KEYWORDS: ${analysis.jdKeywords.join(", ") || "none"}
INTENDED OPENING ANGLE: ${outline.openingHook}
TARGET TONE: ${tone}

Score the draft (integers 1-10, be honest — a 10 is rare) and produce a revised version that fixes anything scoring 7 or below. Return JSON with this exact shape:
{
  "scores": {
    "personalization": number, "recruiterAppeal": number, "clarity": number,
    "atsOptimization": number, "flow": number, "evidenceUse": number,
    "tone": number, "originality": number, "factualAccuracy": number, "readability": number
  },
  "revisedLetter": "the full improved letter text — even if only minor tweaks were needed, return the complete letter, not a diff",
  "changesSummary": ["short bullet describing each meaningful change made, or [] if the draft needed no changes"]
}

REVISION RULES:
- factualAccuracy must reflect ONLY the source-of-truth data above — if the draft states or implies anything not grounded there, that is a hard defect: fix it in revisedLetter and score factualAccuracy accordingly.
- If you lower originality because a sentence reads like a template, rewrite that exact sentence rather than just noting it.
- Preserve what's already working — do not rewrite paragraphs that are already strong just to change them.
- revisedLetter must still be a complete, standalone letter (250-380 words, 3-4 paragraphs, starts with the greeting line, ends with the candidate's name).`;

    return { system, prompt };
}
