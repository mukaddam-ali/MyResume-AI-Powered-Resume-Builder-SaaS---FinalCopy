/**
 * Deterministic job-description keyword matching (Jobscan-style).
 * Extracts known skills/terms from the JD via a curated dictionary with
 * synonyms, then checks which appear in the resume. Same JD + same resume
 * always yields the same match rate.
 */
import { ResumeData } from '@/store/useResumeStore';
import { toPlainLines } from './metrics';

// Canonical skill -> synonyms/variants (all matched case-insensitively on
// word boundaries). Curated for tech/business roles; extend freely.
const SKILL_SYNONYMS: Record<string, string[]> = {
    // Languages
    'JavaScript': ['js', 'ecmascript', 'es6'],
    'TypeScript': ['ts'],
    'Python': [],
    'Java': [],
    'C++': ['cpp'],
    'C#': ['csharp', 'c sharp'],
    'Go': ['golang'],
    'Rust': [],
    'Ruby': [],
    'PHP': [],
    'Swift': [],
    'Kotlin': [],
    'SQL': [],
    'HTML': ['html5'],
    'CSS': ['css3'],
    'Bash': ['shell scripting', 'shell'],
    'R': [],
    'Scala': [],
    'MATLAB': [],

    // Frontend
    'React': ['react.js', 'reactjs'],
    'Next.js': ['nextjs', 'next js'],
    'Vue': ['vue.js', 'vuejs'],
    'Angular': ['angularjs'],
    'Svelte': ['sveltekit'],
    'Tailwind CSS': ['tailwind', 'tailwindcss'],
    'Redux': [],
    'Webpack': [],
    'Vite': [],
    'jQuery': [],
    'Responsive Design': ['mobile-first', 'responsive web'],
    'Accessibility': ['a11y', 'wcag'],

    // Backend
    'Node.js': ['node', 'nodejs'],
    'Express': ['express.js', 'expressjs'],
    'Django': [],
    'Flask': [],
    'FastAPI': [],
    'Spring Boot': ['spring'],
    'Ruby on Rails': ['rails'],
    'Laravel': [],
    '.NET': ['dotnet', 'asp.net'],
    'GraphQL': [],
    'REST API': ['rest apis', 'restful', 'rest'],
    'gRPC': [],
    'Microservices': ['micro-services', 'microservice'],
    'WebSockets': ['websocket'],

    // Data / DB
    'PostgreSQL': ['postgres'],
    'MySQL': [],
    'MongoDB': ['mongo'],
    'Redis': [],
    'Elasticsearch': ['elastic search'],
    'SQLite': [],
    'DynamoDB': [],
    'Supabase': [],
    'Firebase': [],
    'Kafka': ['apache kafka'],
    'Spark': ['apache spark', 'pyspark'],
    'Hadoop': [],
    'ETL': ['data pipelines', 'data pipeline'],
    'Data Warehousing': ['data warehouse', 'snowflake', 'bigquery', 'redshift'],
    'Pandas': [],
    'NumPy': [],
    'Tableau': [],
    'Power BI': ['powerbi'],
    'Excel': ['microsoft excel'],

    // Cloud / DevOps
    'AWS': ['amazon web services'],
    'Azure': ['microsoft azure'],
    'GCP': ['google cloud', 'google cloud platform'],
    'Docker': ['containerization', 'containers'],
    'Kubernetes': ['k8s'],
    'Terraform': ['infrastructure as code', 'iac'],
    'CI/CD': ['continuous integration', 'continuous deployment', 'continuous delivery', 'ci cd'],
    'Jenkins': [],
    'GitHub Actions': ['github workflows'],
    'Linux': ['unix'],
    'Nginx': [],
    'Serverless': ['lambda', 'cloud functions'],
    'Monitoring': ['observability', 'datadog', 'grafana', 'prometheus'],

    // AI / ML
    'Machine Learning': ['ml'],
    'Deep Learning': ['neural networks', 'neural network'],
    'NLP': ['natural language processing'],
    'Computer Vision': ['cv', 'opencv'],
    'TensorFlow': [],
    'PyTorch': [],
    'scikit-learn': ['sklearn', 'scikit learn'],
    'LLM': ['large language models', 'large language model', 'llms'],
    'Prompt Engineering': [],
    'RAG': ['retrieval augmented generation', 'retrieval-augmented'],
    'Data Science': [],
    'A/B Testing': ['ab testing', 'experimentation'],

    // Mobile
    'React Native': [],
    'Flutter': [],
    'iOS': [],
    'Android': [],

    // Practices & tools
    'Git': ['version control', 'github', 'gitlab'],
    'Agile': ['scrum', 'kanban', 'sprint planning'],
    'TDD': ['test-driven development', 'test driven'],
    'Unit Testing': ['jest', 'pytest', 'junit', 'testing'],
    'Code Review': ['code reviews', 'pull requests'],
    'Debugging': ['troubleshooting'],
    'System Design': ['distributed systems', 'scalability', 'architecture'],
    'Security': ['owasp', 'penetration testing', 'appsec', 'authentication', 'authorization'],
    'Performance Optimization': ['performance tuning', 'optimization'],
    'JIRA': [],
    'Figma': [],
    'UX': ['user experience', 'ux design'],
    'UI Design': ['user interface', 'ui/ux'],

    // Business / soft skills that JDs list explicitly
    'Project Management': ['program management'],
    'Product Management': ['product owner', 'roadmap'],
    'Stakeholder Management': ['stakeholders', 'cross-functional'],
    'Communication': ['communication skills', 'written communication', 'verbal communication'],
    'Leadership': ['team lead', 'team leadership', 'mentoring', 'mentorship'],
    'Problem Solving': ['problem-solving', 'analytical skills', 'analytical'],
    'Collaboration': ['teamwork', 'team player'],
    'Time Management': ['prioritization', 'deadlines'],
    'Customer Service': ['customer support', 'client-facing', 'customer-facing'],
    'Sales': ['business development'],
    'Marketing': ['seo', 'digital marketing', 'content marketing'],
    'Data Analysis': ['data analytics', 'data-driven', 'analytics'],
    'Presentation': ['public speaking', 'presentations'],
    'Documentation': ['technical writing', 'technical documentation'],
};

// Precompile: variant -> canonical
const VARIANT_TO_CANONICAL = new Map<string, string>();
for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    VARIANT_TO_CANONICAL.set(canonical.toLowerCase(), canonical);
    for (const s of synonyms) VARIANT_TO_CANONICAL.set(s.toLowerCase(), canonical);
}

/** Escape a variant for regex use; match on word-ish boundaries. */
function variantRegex(variant: string): RegExp {
    const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Word boundaries don't work around symbols like "c++" — use lookarounds
    return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
}

/** All canonical skills whose canonical name or any synonym appears in text. */
function skillsInText(text: string): Set<string> {
    const found = new Set<string>();
    const lower = text.toLowerCase();
    for (const [variant, canonical] of VARIANT_TO_CANONICAL) {
        if (found.has(canonical)) continue;
        // Fast pre-check before regex
        if (!lower.includes(variant.slice(0, Math.min(4, variant.length)))) continue;
        if (variantRegex(variant).test(text)) found.add(canonical);
    }
    return found;
}

/** Flatten the resume into one searchable text blob. */
export function resumeToText(data: ResumeData): string {
    const parts: string[] = [
        data.personalInfo?.fullName || '',
        data.personalInfo?.jobTitle || '',
        data.personalInfo?.summary || '',
        (data.skills || []).join(' '),
    ];
    for (const exp of data.experience || []) {
        parts.push(exp.company, exp.role, ...toPlainLines(exp.description));
    }
    for (const proj of data.projects || []) {
        parts.push(proj.name, proj.technologies || '', ...toPlainLines(proj.description));
    }
    for (const edu of data.education || []) {
        parts.push(edu.school, edu.degree);
    }
    for (const cs of data.customSections || []) {
        parts.push(cs.title);
        for (const item of cs.items || []) parts.push(item.name, ...toPlainLines(item.description));
    }
    return parts.filter(Boolean).join('\n');
}

export interface KeywordMatchResult {
    matchRate: number;          // % of JD skills found in resume
    found: string[];            // canonical skills in both JD and resume
    missing: string[];          // in JD but not resume
    jdSkillCount: number;
}

/**
 * Deterministic JD match: which dictionary skills does the JD ask for,
 * and how many of those does the resume contain?
 */
export function matchJobDescription(data: ResumeData, jobDescription: string): KeywordMatchResult {
    const jdSkills = skillsInText(jobDescription.slice(0, 12_000));
    if (jdSkills.size === 0) {
        return { matchRate: 0, found: [], missing: [], jdSkillCount: 0 };
    }

    const resumeSkills = skillsInText(resumeToText(data));
    const found: string[] = [];
    const missing: string[] = [];
    for (const skill of [...jdSkills].sort()) {
        (resumeSkills.has(skill) ? found : missing).push(skill);
    }

    return {
        matchRate: Math.round((found.length / jdSkills.size) * 100),
        found,
        missing,
        jdSkillCount: jdSkills.size,
    };
}

/** Skills detected in the resume itself (used when no JD is provided). */
export function detectResumeSkills(data: ResumeData): string[] {
    return [...skillsInText(resumeToText(data))].sort();
}
