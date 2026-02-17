# How to Deploy to Netlify

I have configured the project for Netlify deployment.

## Deployment Steps

1.  **Run Netlify Deployment**:
    Open your terminal in the project root and run:
    ```bash
    npx netlify-cli deploy
    ```
    (Note: simple `netlify` might not work if not installed globally, so we use `npx netlify-cli`)

2.  **Follow Prompts**:
    - **Login**: It will open a browser window to authorize Netlify CLI.
    - **Link to existing site**: `No` (create a new site).
    - **Team**: Select your team (or default).
    - **Site Name**: Choose a unique name (or leave blank for random).
    - **Publish directory**: Change to `.next` (or accept default if it detects `netlify.toml`).

3.  **Production Deploy**:
    The first deploy is a "draft" (preview). To deploy to production:
    ```bash
    npx netlify-cli deploy --prod
    ```
    - **Publish directory**: Ensure it is `.next`.

4.  **Add Environment Variables**:
    Go to your Netlify Dashboard > **Site Settings** > **Environment Variables** and add:
        - `NEXT_PUBLIC_SUPABASE_URL`
        - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        - `STRIPE_SECRET_KEY`
        - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
        - `GEMINI_API_KEY`
        - `GROQ_API_KEY`

    Then redeploy for them to take effect.
