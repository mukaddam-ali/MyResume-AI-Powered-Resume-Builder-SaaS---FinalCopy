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
    'Data Analysis': ['data analytics', 'data-driven', 'analytics'],
    'Presentation': ['public speaking', 'presentations'],
    'Documentation': ['technical writing', 'technical documentation'],

    // Sales & business development
    'Sales': ['business development', 'bdr', 'sdr'],
    'CRM': ['salesforce', 'hubspot', 'pipedrive'],
    'Lead Generation': ['prospecting', 'lead gen', 'cold calling', 'cold outreach'],
    'Account Management': ['account executive', 'client relationships', 'key accounts'],
    'Negotiation': ['contract negotiation', 'deal closing', 'closing'],
    'Quota Attainment': ['sales targets', 'quota', 'revenue targets'],
    'Customer Success': ['customer retention', 'churn reduction', 'onboarding'],
    'B2B Sales': ['b2b', 'enterprise sales', 'saas sales'],
    'Retail Sales': ['pos', 'point of sale', 'merchandising', 'upselling'],

    // Marketing & content
    'Marketing': ['digital marketing', 'marketing strategy'],
    'SEO': ['search engine optimization', 'sem', 'search marketing'],
    'Content Marketing': ['content strategy', 'content creation', 'copywriting'],
    'Social Media': ['social media marketing', 'social media management', 'instagram', 'tiktok', 'community management'],
    'Email Marketing': ['mailchimp', 'klaviyo', 'email campaigns', 'newsletters'],
    'Paid Advertising': ['google ads', 'facebook ads', 'meta ads', 'ppc', 'paid media', 'adwords'],
    'Brand Management': ['branding', 'brand strategy'],
    'Market Research': ['competitive analysis', 'consumer insights', 'surveys'],
    'Google Analytics': ['ga4', 'web analytics'],
    'Campaign Management': ['marketing campaigns', 'campaign planning'],

    // Finance & accounting
    'Accounting': ['general ledger', 'bookkeeping', 'accounts payable', 'accounts receivable', 'ap/ar'],
    'Financial Analysis': ['financial modeling', 'financial modelling', 'valuation', 'dcf'],
    'Budgeting': ['forecasting', 'budget management', 'financial planning', 'fp&a'],
    'QuickBooks': [],
    'SAP': [],
    'GAAP': ['ifrs', 'financial reporting'],
    'Auditing': ['internal audit', 'external audit', 'sox compliance'],
    'Tax Preparation': ['tax returns', 'tax compliance'],
    'Payroll': ['payroll processing', 'adp'],
    'Reconciliation': ['account reconciliation', 'bank reconciliation'],
    'Risk Management': ['risk assessment', 'credit risk', 'risk analysis'],
    'CPA': ['certified public accountant'],
    'Investment Analysis': ['portfolio management', 'equity research', 'asset management'],

    // Healthcare
    'Patient Care': ['patient assessment', 'bedside care', 'direct patient care'],
    'Electronic Health Records': ['ehr', 'emr', 'epic', 'cerner', 'medical records'],
    'HIPAA': ['patient privacy', 'hipaa compliance'],
    'Vital Signs': ['patient monitoring', 'triage'],
    'Medication Administration': ['med administration', 'pharmacology', 'medication management'],
    'CPR': ['bls', 'acls', 'first aid', 'life support'],
    'Registered Nurse': ['rn', 'nursing', 'licensed nurse'],
    'Phlebotomy': ['blood draws', 'specimen collection'],
    'Medical Terminology': ['clinical terminology'],
    'Care Planning': ['care plans', 'discharge planning', 'case management'],
    'Infection Control': ['sterilization', 'aseptic technique'],
    'Medical Billing': ['medical coding', 'icd-10', 'cpt coding', 'claims processing'],

    // Human resources
    'Recruiting': ['talent acquisition', 'sourcing', 'full-cycle recruiting', 'headhunting'],
    'Onboarding': ['new hire orientation', 'employee onboarding'],
    'Employee Relations': ['conflict resolution', 'workplace investigations'],
    'HRIS': ['workday', 'bamboohr', 'hr systems'],
    'Performance Management': ['performance reviews', 'talent development'],
    'Benefits Administration': ['compensation', 'benefits', 'total rewards'],
    'Labor Law': ['employment law', 'hr compliance', 'eeo', 'fmla'],
    'Training & Development': ['learning and development', 'l&d', 'employee training', 'curriculum development'],

    // Operations, logistics & admin
    'Operations Management': ['operational efficiency', 'process improvement', 'process optimization'],
    'Supply Chain': ['supply chain management', 'procurement', 'sourcing strategy', 'vendor management'],
    'Inventory Management': ['stock control', 'inventory control', 'warehouse management'],
    'Logistics': ['shipping', 'freight', 'distribution', 'fleet management'],
    'Lean Six Sigma': ['six sigma', 'lean manufacturing', 'kaizen', 'continuous improvement'],
    'Quality Assurance': ['quality control', 'qa/qc', 'iso 9001'],
    'Scheduling': ['calendar management', 'appointment scheduling', 'shift scheduling'],
    'Data Entry': ['records management', 'filing', 'administrative support'],
    'Microsoft Office': ['ms office', 'word', 'powerpoint', 'outlook', 'office suite'],
    'Google Workspace': ['google docs', 'google sheets', 'g suite'],
    'Event Planning': ['event coordination', 'event management'],
    'Report Writing': ['reporting', 'business reporting'],

    // Design & creative
    'Graphic Design': ['visual design', 'brand design'],
    'Adobe Photoshop': ['photoshop'],
    'Adobe Illustrator': ['illustrator'],
    'Adobe InDesign': ['indesign'],
    'Adobe Premiere': ['premiere pro', 'video editing', 'after effects'],
    'Canva': [],
    'Wireframing': ['prototyping', 'mockups'],
    'Design Systems': ['style guides', 'component libraries'],
    'Photography': ['photo editing', 'lightroom'],
    'Motion Graphics': ['animation', '3d modeling', 'blender'],

    // Education & social services
    'Curriculum Design': ['lesson planning', 'instructional design', 'course development'],
    'Classroom Management': ['student engagement', 'behavior management'],
    'Tutoring': ['academic support', 'teaching', 'instruction'],
    'Special Education': ['iep', 'sped', 'differentiated instruction'],
    'Counseling': ['crisis intervention', 'case work', 'social work'],

    // Legal
    'Legal Research': ['westlaw', 'lexisnexis', 'case law research'],
    'Contract Drafting': ['contract review', 'legal drafting', 'contract management'],
    'Litigation': ['discovery', 'depositions', 'trial preparation'],
    'Regulatory Compliance': ['compliance', 'regulatory affairs', 'due diligence'],
    'Paralegal': ['legal assistant', 'legal support'],

    // Hospitality & food service
    'Food Safety': ['servsafe', 'haccp', 'food handling'],
    'Hospitality': ['guest services', 'front desk', 'concierge', 'guest relations'],
    'Bartending': ['mixology', 'barista'],
    'Kitchen Management': ['food preparation', 'line cook', 'culinary', 'menu planning'],
    'Reservations': ['booking systems', 'opentable'],

    // Skilled trades & field work
    'Electrical': ['electrician', 'wiring', 'electrical systems'],
    'HVAC': ['heating and cooling', 'refrigeration'],
    'Plumbing': ['pipefitting'],
    'Welding': ['fabrication', 'mig', 'tig'],
    'Carpentry': ['framing', 'woodworking'],
    'Blueprint Reading': ['schematics', 'technical drawings', 'cad', 'autocad'],
    'Forklift Operation': ['forklift certified', 'heavy machinery', 'osha'],
    'Preventive Maintenance': ['equipment maintenance', 'troubleshooting equipment'],

    // Languages (commonly requested in JDs)
    'Spanish': ['bilingual spanish', 'fluent in spanish'],
    'French': ['fluent in french'],
    'Mandarin': ['chinese', 'fluent in mandarin'],
    'Arabic': ['fluent in arabic'],
    'German': ['fluent in german'],
    'Bilingual': ['multilingual'],
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
