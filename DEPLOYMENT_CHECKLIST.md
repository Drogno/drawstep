# Deployment Checklist & Required Files

## Essential Files for Production

### Environment Configuration
- [ ] `.env.example` - Template for environment variables
- [ ] `.env.local` - Local development environment (not committed)
- [ ] `.env.production` - Production environment (not committed)

### Database & Migration Files
- [ ] `migrations/add_profile_settings.sql` - Complete database schema
- [ ] `types/supabase.ts` - Generated TypeScript types

### Core Application Files
- [ ] `package.json` - Dependencies and scripts
- [ ] `next.config.js` - Next.js configuration
- [ ] `tailwind.config.js` - Tailwind CSS configuration
- [ ] `tsconfig.json` - TypeScript configuration

### Supabase Configuration
- [ ] `lib/supabase/server.ts` - Server-side Supabase client
- [ ] `lib/supabase/client.ts` - Client-side Supabase client

### Authentication System
- [ ] `app/(auth)/actions.ts` - Auth server actions
- [ ] `app/login/page.tsx` - Login page
- [ ] `app/register/page.tsx` - Registration page
- [ ] `lib/guards.ts` - Security guards

### Core Components
- [ ] `components/Header.tsx` - Navigation header
- [ ] `components/UserName.tsx` - User display component
- [ ] `components/ConsentBanner.tsx` - Privacy consent
- [ ] `components/DataManagement.tsx` - GDPR data controls

## Deployment Steps

### 1. Supabase Project Setup
```bash
# Create new project at https://supabase.com/dashboard
# Note Project URL and API keys
# Import SQL schema from migrations/add_profile_settings.sql
```

### 2. Environment Variables
Required for production:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_CLIENT_VERSION=1.0.0
```

### 3. Type Generation
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Generate types
supabase gen types typescript --local > types/supabase.ts
```

### 4. Vercel Deployment
```bash
# Set environment variables in Vercel dashboard
# Deploy via GitHub integration or CLI
vercel --prod
```

### 5. Post-Deployment Verification
- [ ] User registration works
- [ ] Login/logout functions
- [ ] Session tracking active
- [ ] Statistics display correctly
- [ ] Data export/delete works
- [ ] Consent banner appears
- [ ] Charts render properly
- [ ] Mobile responsive

## Required Dependencies

### Core Framework
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0"
}
```

### Supabase & Auth
```json
{
  "@supabase/supabase-js": "^2.38.0",
  "@supabase/ssr": "^0.0.10"
}
```

### UI & Charts
```json
{
  "tailwindcss": "^3.3.0",
  "recharts": "^2.8.0",
  "lucide-react": "^0.294.0"
}
```

### Development
```json
{
  "vitest": "^0.34.0",
  "@types/node": "^20.0.0",
  "eslint": "^8.0.0",
  "prettier": "^3.0.0"
}
```

## Security Checklist

### Database Security
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] User ownership policies active
- [ ] Service role key secure (server-side only)
- [ ] Anonymous key properly scoped

### Application Security
- [ ] User data isolation verified
- [ ] Authentication required for protected routes
- [ ] CSRF protection active
- [ ] Input validation implemented

### Privacy Compliance
- [ ] Consent banner functional
- [ ] Data export working
- [ ] Data deletion working
- [ ] Privacy policy linked
- [ ] Cookie notices if required

## Performance Checklist

### Next.js Optimization
- [ ] Server Components used by default
- [ ] Client Components only when needed
- [ ] Static generation where possible
- [ ] Image optimization enabled

### Database Performance
- [ ] Indexes on frequently queried columns
- [ ] RPC functions optimized
- [ ] Connection pooling configured
- [ ] Query performance monitored

### Frontend Performance
- [ ] Bundle size optimized
- [ ] Lazy loading implemented
- [ ] Chart performance acceptable
- [ ] Mobile performance tested

## Monitoring Setup

### Supabase Monitoring
- [ ] Usage alerts configured
- [ ] Error logging active
- [ ] Performance monitoring enabled
- [ ] Backup strategy in place

### Application Monitoring
- [ ] Error tracking (Sentry/similar)
- [ ] Performance monitoring
- [ ] User analytics (privacy-compliant)
- [ ] Uptime monitoring

## Common Issues & Solutions

### Authentication Issues
- Check environment variables
- Verify Supabase project settings
- Test auth flows manually
- Check browser console for errors

### Database Issues
- Verify RLS policies
- Check table permissions
- Test queries in Supabase dashboard
- Review server logs

### Build Issues
- Check TypeScript errors
- Verify all dependencies installed
- Test build locally first
- Check deployment logs

### Performance Issues
- Monitor bundle size
- Check database query performance
- Optimize images and assets
- Test on various devices

## Files to Exclude from Git

```gitignore
# Environment files
.env.local
.env.production
.env.production.local

# Build output
.next/
dist/
build/

# Dependencies
node_modules/

# Logs
*.log
logs/

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
```