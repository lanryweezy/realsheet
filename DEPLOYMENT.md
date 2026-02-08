# Deployment Guide

This guide covers deploying NexSheet AI to various platforms.

## Vercel Deployment (Recommended)

Vercel is the recommended platform for deploying this application. It provides excellent support for Vite applications with zero configuration.

### Prerequisites

- A Vercel account ([sign up here](https://vercel.com/signup))
- Your code pushed to GitHub, GitLab, or Bitbucket

### Quick Deploy

1. **Import Project:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Vercel will auto-detect Vite configuration

2. **Configure Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add `VITE_GEMINI_API_KEY` (optional, for AI features)
   - Add `NODE_ENV=production` (usually auto-set)

3. **Deploy:**
   - Click "Deploy"
   - Your app will be live in ~2 minutes!

### Manual Deployment via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables in Vercel

Set these in your Vercel project settings:

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_GEMINI_API_KEY` | Your Gemini API key | No |
| `NODE_ENV` | `production` | Auto-set |

## GitHub Actions Automated Deployment

The repository includes automated deployment via GitHub Actions.

### Setup

1. **Get Vercel Credentials:**
   - Go to [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
   - Create a new token → Copy the token
   - Go to your project settings → Copy `Org ID` and `Project ID`

2. **Add GitHub Secrets:**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Add these secrets:
     - `VERCEL_TOKEN` - Your Vercel token
     - `VERCEL_ORG_ID` - Your Vercel organization ID
     - `VERCEL_PROJECT_ID` - Your Vercel project ID

3. **Push to Main:**
   ```bash
   git push origin main
   ```

4. **Automatic Deployment:**
   - The workflow will build and test on every push
   - It will deploy to Vercel on pushes to `main` branch
   - Check the Actions tab for deployment status

## Netlify Deployment

1. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Environment Variables:**
   - Add `VITE_GEMINI_API_KEY` in site settings

3. **Redirects:**
   Create `public/_redirects`:
   ```
   /*    /index.html   200
   ```

## Other Platforms

### Cloudflare Pages

1. Connect your Git repository
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Add environment variable: `VITE_GEMINI_API_KEY`

### AWS Amplify

1. Connect your Git repository
2. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add environment variable: `VITE_GEMINI_API_KEY`

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Build and run:

```bash
docker build -t nexsheet-ai .
docker run -p 80:80 nexsheet-ai
```

## Troubleshooting

### Build Fails

- Check Node.js version (requires 18+)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run type-check`

### Environment Variables Not Working

- Ensure variables are prefixed with `VITE_` for Vite to expose them
- Restart dev server after adding variables
- Check browser console for errors

### Routing Issues (404 on Refresh)

- Ensure your hosting platform supports SPA routing
- Add redirect rules (see platform-specific sections above)

## Performance Optimization

The build is already optimized with:
- Code splitting (React, Charts, Excel libraries)
- Minification via esbuild
- Asset optimization
- Source maps disabled in production

For further optimization:
- Enable CDN caching for static assets
- Use Vercel Edge Functions for API routes (if needed)
- Implement lazy loading for heavy components

## Monitoring

Consider adding:
- Error tracking (Sentry, LogRocket)
- Analytics (Vercel Analytics, Google Analytics)
- Performance monitoring (Web Vitals)

## Support

For deployment issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- GitHub Issues
