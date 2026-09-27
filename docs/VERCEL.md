# Vercel deployment

Import `sahilm200/PyrGraph` into Vercel after the deployment commit reaches the branch you want to host. Use the repository root, the Vite framework preset, `npm run build`, and the `dist` output directory. `vercel.json` supplies the API and SPA rewrites. Use Node.js 22 or 24 for the functions.

Set `GEMINI_API_KEY` in Vercel's server environment variables to enable live Gemini drafts. Do not prefix the name with `VITE_`, and do not commit the key. Without it, `/api/intro` returns a clearly labeled template fallback. Redeploy after changing environment variables.

Verify the deployed URL with `GET /api/health` (confirm `geminiConfigured`), then load the app, add Yanni's synthetic network, analyze, and draft an intro from a selected route. Check the draft's source label before calling it live Gemini.

The GitHub OAuth setup screen stores credentials in process memory. Vercel functions can start on different instances, so that setup is not persistent across requests. The core network, analysis, CSV, and drafting flow does not depend on it.
