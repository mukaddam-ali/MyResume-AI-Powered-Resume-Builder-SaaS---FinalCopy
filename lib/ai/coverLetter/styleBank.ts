/**
 * Style-diversity directives, sampled once per generation and threaded
 * unchanged through the Outline and Draft stages so consecutive letters for
 * similar profiles don't read templated. Flavor, not correctness — no
 * dedup/seeding needed.
 */
export const STYLE_DIRECTIVES: string[] = [
    // Sentence rhythm
    "Vary sentence length noticeably — mix short, punchy sentences with longer, flowing ones.",
    "Favor shorter sentences throughout. Let the achievements carry the weight, not the sentence length.",
    "Use one longer, confident sentence early to establish command of the subject, then shorten up.",
    "Build toward the strongest point with a short sentence right before it for emphasis.",
    // Opening strategy
    "Open with a specific, concrete detail (a project, a number, a moment) rather than a generic 'I am excited to apply' line.",
    "Open by naming something specific about the company or role that genuinely connects to the candidate's background.",
    "Open mid-thought, as if continuing a natural train of reasoning about why this role fits, not with a formal announcement.",
    // Structural variation
    "Let one paragraph be evidence-led (lead with the accomplishment, then connect it to the role) instead of every paragraph following the same claim-then-evidence order.",
    "Break the expected 3-paragraph rhythm — use four shorter paragraphs if it serves clarity better.",
    "Weave the transition between paragraphs through an idea, not a stock phrase like 'In addition' or 'Furthermore'.",
    // Vocabulary register
    "Use plain, direct vocabulary — avoid corporate jargon and inflated adjectives entirely.",
    "Allow a touch of personality in word choice without ever becoming casual or unprofessional.",
    "Prefer verbs that show action taken (built, led, reduced, shipped) over abstract nouns (leadership, innovation, synergy).",
    // Closing style
    "Close with a forward-looking, specific note about what the candidate wants to contribute, not a generic 'I look forward to hearing from you.'",
    "Close briefly and confidently — one or two sentences, no restating of the whole letter.",
    "End on the strongest piece of evidence's implication rather than a separate closing thought.",
];

export function sampleStyleDirective(): string {
    return STYLE_DIRECTIVES[Math.floor(Math.random() * STYLE_DIRECTIVES.length)];
}
