# Cloudflare Pages Deployment Guide

## Quick Setup

1. **Go to Cloudflare Dashboard** → Pages → Create a project
2. **Connect your GitHub repository**: `vishnumahesha/LifemaxV2`
3. **Configure build settings**:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Root directory**: `lifemax-app` (if deploying from monorepo root, or leave blank if deploying from app root)
   - **Node version**: 20.x (or latest LTS)

## Environment Variables

Add these in Cloudflare Pages → Settings → Environment Variables:

### Required:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `REPLICATE_API_TOKEN` - Your Replicate API token
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)
- `NEXT_PUBLIC_SITE_URL` - Your Cloudflare Pages URL (e.g., https://your-app.pages.dev)

### Optional:
- `OPEN_FOOD_FACTS_BASE_URL` - Defaults to https://world.openfoodfacts.org

## Important Notes

⚠️ **Next.js 16 on Cloudflare Pages:**
- Cloudflare Pages now supports Next.js 16 natively
- API routes will work automatically
- No special adapter needed for Next.js 16

⚠️ **API Routes:**
- All your API routes (`/api/face/scan`, `/api/body/scan`, etc.) will work on Cloudflare Pages
- They run as Cloudflare Workers automatically

⚠️ **Environment Variables:**
- Make sure to set ALL environment variables in Cloudflare dashboard
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Other variables are server-only

## Deployment Steps

1. Push your code to GitHub (already done ✅)
2. Connect repository to Cloudflare Pages
3. Set build settings (see above)
4. Add environment variables
5. Deploy!

## Troubleshooting

- **Build fails**: Check Node version (should be 20.x)
- **API routes not working**: Verify environment variables are set
- **Environment variables not loading**: Make sure they're set in Cloudflare dashboard, not just `.env.local`
