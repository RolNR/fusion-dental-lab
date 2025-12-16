# LabWiseLink

A production-ready platform for managing dental lab orders between dentists and labs.

## Features

- 🔐 **Authentication & RBAC** - Role-based access for Dentists, Labs, and Admins
- 📦 **Order Management** - Create, track, and manage dental lab orders
- 📁 **File Storage** - Upload STL files and images to Cloudflare R2
- 🔔 **Alert System** - Communication between dentists and labs
- 📊 **Audit Logging** - Complete audit trail for compliance
- 🖼️ **File Preview** - Preview STL files and images in browser

## Tech Stack

- **Frontend & Backend**: Next.js 15 (App Router + API Routes)
- **Database**: PostgreSQL (Neon recommended)
- **ORM**: Prisma 7
- **Storage**: Cloudflare R2
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS 4

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon recommended)
- Cloudflare R2 bucket

### Installation

1. **Install dependencies**

```bash
npm install
```

2. **Setup environment variables**

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `R2_*` - Your Cloudflare R2 credentials

3. **Setup database**

```bash
# Push schema to database
npm run db:push

# Or create a migration
npm run db:migrate
```

4. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

See `database-schema.md` for the complete ER diagram and documentation.

Key models:
- **User** - Dentists, Labs, Admins
- **Order** - Dental lab orders with status tracking
- **File** - STL files and images in R2
- **Alert** - Communication between users
- **AuditLog** - Complete audit trail

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Utility libraries
│   ├── prisma.ts    # Prisma client singleton
│   ├── auth.ts      # NextAuth configuration
│   └── r2.ts        # R2 storage client
└── types/           # TypeScript types

prisma/
├── schema.prisma    # Database schema
└── migrations/      # Database migrations
```

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio

## Deployment

### Recommended: Vercel + Neon

1. **Database**: Create a Neon database at [neon.tech](https://neon.tech)
2. **Storage**: Create a Cloudflare R2 bucket
3. **Deploy**: Push to GitHub and deploy on Vercel

### Environment Variables for Production

Make sure to set all variables from `.env.example` in your deployment platform.

## Development Workflow

1. Make schema changes in `prisma/schema.prisma`
2. Run `npm run db:push` for development
3. Run `npm run db:migrate` before deploying to production
4. Always test with production-like data

## Security Features

- Password hashing with bcrypt
- Role-based access control (RBAC)
- Audit logging for all actions
- Secure file uploads with validation
- SQL injection prevention via Prisma
- Environment variable validation

## License

Private - All rights reserved
