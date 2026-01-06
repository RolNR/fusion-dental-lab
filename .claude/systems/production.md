# Production Deployment System

**Status**: Production
**Platform**: Vercel + Neon PostgreSQL + Cloudflare R2
**Last Updated**: 2026-01-05

## Infrastructure Stack

### Frontend/Backend
- **Platform**: Vercel
- **Framework**: Next.js 16 (App Router)
- **Runtime**: Node.js (Vercel serverless functions)
- **Build**: Turbopack
- **Region**: Auto (edge network)

### Database
- **Provider**: Neon (Serverless PostgreSQL)
- **Version**: PostgreSQL 15+
- **ORM**: Prisma 6
- **Connection**: Connection pooling enabled
- **Migrations**: Manual migrations required before deploy

### File Storage
- **Provider**: Cloudflare R2 (S3-compatible)
- **Bucket**: dental-lab-files
- **Access**: Public URL for file downloads
- **CDN**: Cloudflare CDN (automatic)

## Environment Variables

**Required for Production:**

```bash
# Database
DATABASE_URL="postgresql://..."          # Neon connection string

# Authentication
NEXTAUTH_URL="https://yourdomain.com"    # Production URL
NEXTAUTH_SECRET="..."                     # openssl rand -base64 32

# Cloudflare R2
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_ENDPOINT="https://...r2.cloudflarestorage.com"
R2_BUCKET_NAME="dental-lab-files"
R2_PUBLIC_URL="https://...r2.dev"
NEXT_PUBLIC_R2_PUBLIC_URL="https://...r2.dev"  # Client-side access
```

## Deployment Process

### Pre-deployment Checklist

1. **Run tests locally**:
   ```bash
   npm run build  # MUST pass without errors
   npm run lint
   ```

2. **Database migrations**:
   ```bash
   npm run db:migrate  # Creates migration files
   # Push migration to production via Vercel deploy
   ```

3. **Environment variables**: Verify all variables set in Vercel dashboard

### Deployment Steps

1. **Push to main branch** (or configured production branch):
   ```bash
   git push origin main
   ```

2. **Vercel auto-deploys**:
   - Runs `npm run build`
   - Executes Prisma migrations (if configured)
   - Deploys to edge network

3. **Post-deployment verification**:
   - Check Vercel deployment logs
   - Test authentication flow
   - Verify database connectivity
   - Test file upload/download

## Health Checks

**Application health**:
```bash
curl https://yourdomain.com/api/health
```

**Database connectivity**:
- Monitor via Neon dashboard
- Check connection pooler status

**File storage**:
- Test file upload via UI
- Verify public URL accessibility

## Monitoring & Logs

**Application logs**:
- Vercel Dashboard → Project → Logs
- Real-time function logs
- Build logs

**Database monitoring**:
- Neon Dashboard → Monitoring
- Query performance
- Connection stats

**Error tracking**:
- Check Vercel error logs
- Monitor API route failures
- Track authentication errors

## Rollback Procedure

1. **Revert deployment** via Vercel dashboard:
   - Go to Deployments
   - Find last stable deployment
   - Click "Promote to Production"

2. **Database rollback** (if needed):
   ```bash
   # Revert migration
   npx prisma migrate resolve --rolled-back <migration_name>
   ```

## Scaling Considerations

**Current limits**:
- Vercel: Serverless functions (10s timeout on Pro)
- Neon: Connection pooling handles concurrent requests
- R2: Unlimited bandwidth (no egress fees)

**Scale triggers**:
- Monitor Vercel function duration
- Watch database connection count
- Track R2 request patterns

## Security

**Best practices in place**:
- JWT sessions (30-day expiry)
- Role-based access control (middleware + API)
- Environment variables (never committed)
- HTTPS enforced (Vercel automatic)
- CORS configured for R2 public URLs

**Secrets management**:
- All secrets in Vercel environment variables
- Never log sensitive data
- Rotate NEXTAUTH_SECRET periodically

## Disaster Recovery

**Database backups**:
- Neon automatic daily backups
- Point-in-time recovery available
- Backup retention: 7 days (configurable)

**File storage**:
- R2 versioning (if enabled)
- Consider periodic bucket backups

**Code**:
- Git repository is source of truth
- All deployments tagged in Vercel
- Can redeploy any commit

## Common Issues

**Build failures**:
- Check TypeScript errors: `npm run build`
- Verify all imports resolve
- Check for missing environment variables

**Database connection issues**:
- Verify DATABASE_URL in Vercel
- Check Neon connection pooler status
- Monitor connection count

**File upload failures**:
- Verify R2 credentials
- Check CORS configuration on R2 bucket
- Verify public URL matches environment variable

## Performance Optimization

**Current optimizations**:
- Vercel edge caching
- Prisma query optimization
- R2 CDN for file delivery
- Next.js image optimization

**Monitoring metrics**:
- Vercel Analytics
- Database query performance (Neon)
- API route response times
- File download speeds

## Documentation References

- Full deployment guide: `docs/deployment-guide.md`
- Architecture overview: `CLAUDE.md`
- Database schema: `.claude/modules/database.md`
