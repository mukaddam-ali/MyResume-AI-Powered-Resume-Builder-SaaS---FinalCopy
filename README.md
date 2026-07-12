<div align="center">

<br />

# 📄 MyResume
### AI-Powered Resume Builder SaaS

**Build a job-winning resume in minutes — powered by AI, loved by professionals.**

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<br />

[🚀 Live Demo](#) &nbsp;·&nbsp; [📖 Docs](#getting-started) &nbsp;·&nbsp; [🐛 Report Bug](https://github.com/mukaddam-ali/MyResume-AI-Powered-Resume-Builder-SaaS---FinalCopy/issues) &nbsp;·&nbsp; [💡 Request Feature](https://github.com/mukaddam-ali/MyResume-AI-Powered-Resume-Builder-SaaS---FinalCopy/issues)

<br />

</div>

---

## ✨ Features

### 🤖 AI-Powered
- **AI Resume Parser** — Upload a PDF and let AI extract and fill all your information instantly
- **ATS Score Analyzer** — Get detailed ATS compatibility scores with actionable feedback powered by **Google Gemini**
- **Smart Content Suggestions** — AI-assisted writing powered by **Groq (LLaMA)**

### 🎨 Beautiful Templates
- **5 Professional Templates** — Classic, Modern, Minimalist, Creative, Velvet
- **Real-time Live Preview** — See changes instantly as you type
- **Custom Theme Colors** — Personalize your resume's accent color
- **Font Selection** — Choose from 20+ professional Google Fonts
- **Section Scale & Spacing** — Fine-tune every section independently

### 📱 Full-Featured Editor
- **Drag & Drop Sections** — Reorder resume sections with smooth DnD
- **Rich Text Support** — Bold, italic, underline, bullet lists in descriptions
- **Profile Photo** — Upload with brightness, contrast, grayscale, and border controls
- **Custom Sections** — Add volunteering, certifications, awards, or anything custom
- **Section Visibility** — Show/hide any section with one click

### ☁️ Cloud Sync & Storage
- **Auto-Save** — Changes saved to cloud automatically (3s debounce)
- **Smart Merge** — Local edits always win over stale cloud data on sync
- **Multi-Resume Dashboard** — Manage multiple resumes side by side
- **Google OAuth** — One-click sign-in with Supabase Auth

### 💾 Export & Download
- **PDF Export** — High-fidelity PDF via `@react-pdf/renderer`
- **Community Templates** — Publish your resume as a public template for others to use

### 💳 Monetization
- **Pro Plan** — Stripe-powered subscription for premium features
- **Hide Branding** — Pro feature to remove "Powered by MyResume"

---

## 🖼️ Screenshots

> *Add screenshots here after deploying*

| Dashboard | Editor | PDF Export |
|-----------|--------|------------|
| ![Dashboard]() | ![Editor]() | ![PDF]() |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | Radix UI + shadcn/ui |
| **Animations** | Framer Motion |
| **State Management** | Zustand (with localStorage persistence) |
| **Auth & Database** | Supabase (PostgreSQL + Row Level Security) |
| **AI — Analysis** | Google Gemini (via `@ai-sdk/google`) |
| **AI — Text** | Groq / LLaMA (via `@ai-sdk/groq`) |
| **PDF Generation** | @react-pdf/renderer |
| **Payments** | Stripe |
| **Drag & Drop** | @dnd-kit |
| **Rich Text** | Tiptap |
| **Forms** | React Hook Form + Zod |

---

## 🚀 Getting Started

### Prerequisites

- Node.js `18+`
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account (for payments)
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)
- A [Groq](https://groq.com) API key

### 1. Clone the Repository

```bash
git clone https://github.com/mukaddam-ali/MyResume-AI-Powered-Resume-Builder-SaaS---FinalCopy.git
cd MyResume-AI-Powered-Resume-Builder-SaaS---FinalCopy
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI
GEMINI_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-api-key

# Stripe (test mode works — use pk_test_/sk_test_ keys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# Required for webhook-driven Pro upgrades (Stripe dashboard -> Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase service role (server-only!) — required to grant Pro after payment.
# Found in Supabase dashboard -> Settings -> API. NEVER expose to the client.
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Set Up the Database

Run the SQL migrations in your Supabase SQL editor:

```bash
# Found in /supabase/migrations/ — run them in order:
001_create_public_templates.sql
20240523000000_feedback_schema.sql
002_entitlements_and_fixes.sql   # profiles (tier), resumes table, RLS fixes
```

`002_entitlements_and_fixes.sql` creates the `resumes` table, the `profiles`
table (server-side source of truth for free/pro tier), and fixes the feedback
admin policies — no manual SQL needed beyond running the migrations.

To receive Pro upgrades automatically, add a Stripe webhook (test mode is fine)
pointing to `https://your-domain/api/stripe/webhook` for the
`payment_intent.succeeded` event, and put its signing secret in
`STRIPE_WEBHOOK_SECRET`. The app also verifies payments synchronously via
`/api/stripe/verify-payment`, so upgrades work even before the webhook is set up.

### 5. Configure Supabase Auth

In your Supabase dashboard → **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/auth/callback`

Enable **Google OAuth** in Authentication → Providers.

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── ai/           # AI endpoints (analyze, parse-resume)
│   │   ├── resumes/      # CRUD for resumes
│   │   ├── templates/    # Public template publish/unpublish
│   │   └── stripe/       # Payment webhooks
│   ├── auth/             # Auth callback route
│   ├── dashboard/        # My Resumes page
│   └── editor/           # Resume editor page
├── components/
│   ├── dashboard/        # ResumeCard
│   ├── editor/           # EditorPanel, forms, AutoSaveHandler
│   ├── home/             # HeroSection, TemplateGallery, Features
│   ├── preview/          # LiveResume, ResumeDocument (PDF), PreviewPanel
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── auth-context.tsx  # Supabase auth provider
│   ├── fonts-*.ts        # Font registration for PDF
│   └── supabase*.ts      # Supabase clients (browser + server)
├── store/
│   └── useResumeStore.ts # Zustand store (all resume state + cloud sync)
└── supabase/
    └── migrations/       # SQL schema files
```

---

## ☁️ Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mukaddam-ali/MyResume-AI-Powered-Resume-Builder-SaaS---FinalCopy)

1. Click the button above or go to [vercel.com](https://vercel.com)
2. Import this repository
3. Add all environment variables from `.env.local`
4. Deploy ✅

> After deploying, update your Supabase redirect URLs to include your Vercel domain.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the project
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) — The React framework for production
- [Supabase](https://supabase.com/) — The open source Firebase alternative
- [shadcn/ui](https://ui.shadcn.com/) — Beautifully designed components
- [Google Gemini](https://ai.google.dev/) — AI analysis engine
- [Groq](https://groq.com/) — Ultra-fast AI inference
- [Vercel](https://vercel.com/) — Deployment platform

---

<div align="center">

Made with ❤️ by **Ali Mukaddam**

⭐ **Star this repo** if you found it helpful!

</div>