# Deployment Guide - LabWiseLink

Complete step-by-step guide to deploy LabWiseLink to production using Vercel, Neon (PostgreSQL), and Cloudflare R2.

---

## Prerequisites

- GitHub account with your repository
- Terminal access for running commands
- Credit card (for Cloudflare verification - no charges on free tier)

---

## 1. Database Setup - Neon PostgreSQL

### Step 1.1: Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Click "Sign Up" and authenticate with GitHub
3. You'll be redirected to the Neon console

### Step 1.2: Create Database Project
1. Click "Create Project"
2. Configure:
   - **Project name**: `labwiselink-production` (or your preferred name)
   - **PostgreSQL version**: 16 (latest)
   - **Region**: Choose closest to your users (e.g., `US East (Ohio)` or `EU (Frankfurt)`)
3. Click "Create Project"

### Step 1.3: Get Connection String
1. Once created, you'll see the connection details
2. Copy the **Connection string** - it looks like:
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. **SAVE THIS** - you'll need it for Vercel environment variables

### Step 1.4: Enable Connection Pooling (Important for Vercel)
1. In your Neon project dashboard, go to "Connection Details"
2. Toggle "Pooled connection" ON
3. Copy the **pooled connection string** (it will have a different port, usually 5432)
4. **Use this pooled connection string as your `DATABASE_URL`**

✅ **What to save:**
```bash
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
```

---

## 2. File Storage Setup - Cloudflare R2

### Step 2.1: Create Cloudflare Account
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sign up with your email
3. Verify your email address

### Step 2.2: Set Up R2 Storage
1. In Cloudflare dashboard, click **R2** in the left sidebar
2. Click "Create bucket"
3. Configure:
   - **Bucket name**: `dental-lab-files` (or your preferred name)
   - **Location**: Automatic (or choose closest region)
4. Click "Create bucket"

### Step 2.3: Configure Public Access
1. Click on your newly created bucket
2. Go to "Settings" tab
3. Scroll to "Public access"
4. Click "Connect Domain" or "Allow Access"
5. If using a custom domain:
   - Add your subdomain (e.g., `files.yourdomain.com`)
   - Follow DNS setup instructions
6. If using R2.dev domain:
   - Click "Allow Access"
   - Copy the public URL (e.g., `https://pub-xxxxx.r2.dev`)

### Step 2.4: Create API Token
1. Go to **R2** → **Manage R2 API Tokens**
2. Click "Create API Token"
3. Configure:
   - **Token name**: `labwiselink-production`
   - **Permissions**: "Object Read & Write"
   - **Bucket**: Select your bucket (`dental-lab-files`)
   - **TTL**: Leave blank (never expires)
4. Click "Create API Token"
5. **IMPORTANT**: Copy and save these values immediately (you won't see them again):
   - Access Key ID
   - Secret Access Key
   - Endpoint URL

✅ **What to save:**
```bash
R2_ACCESS_KEY_ID="your_access_key_id_here"
R2_SECRET_ACCESS_KEY="your_secret_access_key_here"
R2_ENDPOINT="https://xxxxxxxxxxxxx.r2.cloudflarestorage.com"
R2_BUCKET_NAME="dental-lab-files"
R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"  # Or your custom domain
NEXT_PUBLIC_R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"  # Same as above
```

---

## 3. Vercel Deployment

### Step 3.1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" and authenticate with GitHub

### Step 3.2: Import Project
1. Click "Add New..." → "Project"
2. Import your GitHub repository: `dental-lab-platform`
3. Click "Import"

### Step 3.3: Configure Project Settings
1. **Framework Preset**: Next.js (should auto-detect)
2. **Root Directory**: `./` (leave default)
3. **Build Command**:
   ```bash
   prisma generate && next build
   ```
4. **Output Directory**: `.next` (leave default)
5. **Install Command**: `npm install` (leave default)

### Step 3.4: Environment Variables
Click "Environment Variables" and add the following:

**Copy this entire block and add each variable:**

```bash
# Database (from Neon - Step 1.4)
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true

# NextAuth Configuration
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=GENERATE_THIS_BELOW

# Cloudflare R2 Storage (from Step 2.4)
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_ENDPOINT=https://xxxxxxxxxxxxx.r2.cloudflarestorage.com
R2_BUCKET_NAME=dental-lab-files
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_SITE_NAME=LabWiseLink
NODE_ENV=production
```

### Step 3.5: Generate NEXTAUTH_SECRET
**On your local machine**, run this command:

```bash
openssl rand -base64 32
```

Copy the output and use it as the value for `NEXTAUTH_SECRET` in Vercel.

**Example output:**
```
xK9j2Lm5Pq8RtYu3Wv6Az1Bc4Df7Gh0Ik=
```

### Step 3.6: Update NEXTAUTH_URL
After deployment, Vercel will give you a URL like `https://dental-lab-platform-xxxxx.vercel.app`

Update these environment variables with your actual URL:
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SITE_URL`

### Step 3.7: Deploy
1. Click "Deploy"
2. Wait for the build to complete (2-3 minutes)
3. If build fails, check the logs and verify all environment variables are set correctly

---

## 4. Database Migration

After your first deployment succeeds, you need to initialize the database schema.

### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link your project**:
   ```bash
   vercel link
   ```
   - Select your team/account
   - Select the project you just deployed

4. **Pull environment variables**:
   ```bash
   vercel env pull .env.production
   ```

5. **Run database migration**:
   ```bash
   DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d '=' -f2-)" npx prisma migrate deploy
   ```

### Option B: Using Neon SQL Editor

1. Go to your Neon project dashboard
2. Click "SQL Editor"
3. You'll need to manually run the SQL from your migrations
4. Find migration files in: `prisma/migrations/`
5. Copy and paste the SQL into the editor
6. Execute

### Option C: Add to Vercel Build Command (Not Recommended for Production)

Change build command to:
```bash
prisma generate && prisma migrate deploy && next build
```

**Note**: This runs migrations on every deploy, which can cause issues.

---

## 5. Create Your First Lab Admin User

After database is set up, you need to create your first admin user.

### Step 5.1: Use the Create Lab Admin Script

1. **Pull production environment variables locally**:
   ```bash
   vercel env pull .env.production
   ```

2. **Run the create admin script**:
   ```bash
   DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d '=' -f2-)" npm run create-lab-admin
   ```

3. **Follow the prompts**:
   - Enter laboratory name (e.g., "LabWiseLink")
   - Enter admin email
   - Enter admin name
   - Enter password (minimum 8 characters)

4. **Save the credentials** - you'll use these to log in

### Step 5.2: Test Login

1. Go to your deployed app: `https://your-app.vercel.app`
2. Navigate to `/auth/login`
3. Log in with the credentials you just created

---

## 6. Post-Deployment Configuration

### Step 6.1: Set Up Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Update environment variables:
   - `NEXTAUTH_URL=https://yourdomain.com`
   - `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`
6. Redeploy to apply changes

### Step 6.2: Configure CORS for R2 (If needed)

If you have CORS issues with file uploads:

1. Go to Cloudflare R2 → Your bucket → Settings
2. Add CORS policy:
   ```json
   [
     {
       "AllowedOrigins": ["https://your-app.vercel.app"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

### Step 6.3: Set Up Monitoring (Optional but Recommended)

1. **Vercel Analytics**:
   - Go to your project → Analytics
   - Enable Web Analytics (free on hobby plan)

2. **Neon Monitoring**:
   - Check your Neon dashboard regularly
   - Monitor database size and connection usage

3. **Cloudflare R2 Monitoring**:
   - Check R2 dashboard for storage usage
   - Monitor bandwidth usage

---

## 7. Environment Variables Reference

Here's the complete list of environment variables you need in Vercel:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require&pgbouncer=true

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-generated-secret-here

# Cloudflare R2
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_ENDPOINT=https://xxxxx.r2.cloudflarestorage.com
R2_BUCKET_NAME=dental-lab-files
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Site Config
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NEXT_PUBLIC_SITE_NAME=LabWiseLink
NODE_ENV=production
```

---

## 8. Troubleshooting

### Build Fails with Prisma Error
**Problem**: Build fails with "Prisma Client not generated"

**Solution**: Ensure build command includes `prisma generate`:
```bash
prisma generate && next build
```

### Database Connection Errors
**Problem**: "Too many connections" or timeout errors

**Solution**:
1. Verify you're using the **pooled connection string** from Neon
2. Check that `pgbouncer=true` is in your connection string
3. Restart your Vercel deployment

### File Upload Errors
**Problem**: Files not uploading to R2

**Solution**:
1. Verify R2 API credentials are correct
2. Check bucket name matches exactly
3. Verify CORS policy is set up
4. Check R2 endpoint URL format

### NextAuth Errors
**Problem**: "Cannot read NEXTAUTH_SECRET" or authentication fails

**Solution**:
1. Regenerate `NEXTAUTH_SECRET` with `openssl rand -base64 32`
2. Verify `NEXTAUTH_URL` matches your deployment URL exactly
3. Redeploy after updating variables

### 404 on Login Page
**Problem**: `/auth/login` returns 404

**Solution**: This shouldn't happen with the current setup, but verify:
1. File exists at `src/app/auth/login/page.tsx`
2. Build completed successfully
3. Clear Vercel cache and redeploy

---

## 9. Cost Breakdown (Free Tier Limits)

### Neon (Free Tier)
- ✅ 0.5 GB storage
- ✅ Unlimited queries
- ✅ 1 project
- ✅ Always-available compute with some limits

### Cloudflare R2 (Free Tier)
- ✅ 10 GB storage/month
- ✅ 1 million Class A operations/month (writes)
- ✅ 10 million Class B operations/month (reads)
- ✅ No egress fees

### Vercel (Hobby Plan - Free)
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless function execution: 100 GB-hours
- ✅ 6,000 build minutes/month
- ⚠️ Commercial use requires Pro plan ($20/month)

**Total monthly cost for starting**: **$0** (within free tier limits)

---

## 10. Next Steps After Deployment

1. ✅ Create your first clinic
2. ✅ Add clinic users (doctors, admins, assistants)
3. ✅ Test order creation and file upload
4. ✅ Configure email notifications (future enhancement)
5. ✅ Set up monitoring and alerts
6. ✅ Consider upgrading to paid plans when needed

---

## Support and Resources

- **Neon Documentation**: https://neon.tech/docs
- **Cloudflare R2 Documentation**: https://developers.cloudflare.com/r2/
- **Vercel Documentation**: https://vercel.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **Prisma Documentation**: https://www.prisma.io/docs

---

## Quick Reference: Command Cheat Sheet

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Pull environment variables
vercel env pull .env.production

# Run migrations
DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d '=' -f2-)" npx prisma migrate deploy

# Create lab admin
DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d '=' -f2-)" npm run create-lab-admin

# Deploy from CLI
vercel --prod
```

---

## Checklist

Before going live, verify:

- [ ] Neon database created with pooled connection
- [ ] Cloudflare R2 bucket created with public access
- [ ] All environment variables set in Vercel
- [ ] `NEXTAUTH_SECRET` generated and set
- [ ] Build succeeds in Vercel
- [ ] Database migrations run successfully
- [ ] Lab admin user created
- [ ] Can log in to the application
- [ ] File uploads work
- [ ] Test creating a clinic
- [ ] Test creating users
- [ ] Test creating an order

---

**Deployment Date**: _________

**Deployed URL**: _________

**Database**: Neon - Project: _________

**Storage**: Cloudflare R2 - Bucket: _________

---

🎉 **Congratulations! Your LabWiseLink platform is now live!**
