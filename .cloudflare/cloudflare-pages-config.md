# Cloudflare Pages Configuration

## ⚠️ IMPORTANT: Build Settings

When setting up your Cloudflare Pages project, use these exact settings:

### Build Configuration:
- **Framework preset**: `Next.js (Static HTML Export)` or `Next.js`
- **Build command**: `cd lifemax-app && npm install && npm run build`
- **Build output directory**: `lifemax-app/.next` (or `.next` if root directory is `lifemax-app`)
- **Root directory**: Leave blank (or set to `lifemax-app` if your repo root is the parent directory)
- **Node version**: `20.x` or latest LTS

### ⚠️ CRITICAL: Deploy Command
- **DO NOT SET A CUSTOM DEPLOY COMMAND**
- **Leave the deploy command field EMPTY/BLANK**
- Cloudflare Pages automatically handles Next.js deployment
- The error you saw was because a custom `npx wrangler deploy` command was set

### Environment Variables:
Set these in Cloudflare Pages → Settings → Environment Variables:

```
GEMINI_API_KEY=your-key-here
REPLICATE_API_TOKEN=your-token-here
NEXT_PUBLIC_SUPABASE_URL=your-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
SUPABASE_SERVICE_ROLE_KEY=your-key-here
NEXT_PUBLIC_SITE_URL=https://your-app.pages.dev
```

## How to Fix the Current Error:

1. Go to your Cloudflare Pages project settings
2. Navigate to "Builds & deployments" → "Build configuration"
3. **Remove/clear the "Deploy command" field** (leave it empty)
4. Make sure "Build command" is set to: `cd lifemax-app && npm install && npm run build`
5. Make sure "Build output directory" is set to: `lifemax-app/.next`
6. Save and retry the build

The build succeeded - the issue is only with the deploy step!
