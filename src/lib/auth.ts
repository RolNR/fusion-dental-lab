import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  // JWT strategy (stateless, no database session table needed)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // Custom pages
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  // Authentication providers
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const { email, password } = credentials;

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Check if user is approved
        if (!user.isApproved) {
          throw new Error('Your account is pending admin approval. Please check back later.');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }

        // Return user data for session
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isApproved: user.isApproved,
        };
      },
    }),
  ],

  // Callbacks to customize JWT and session
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On sign in, add user info to token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
        token.isApproved = user.isApproved;
      }

      // Handle profile updates
      if (trigger === 'update' && session) {
        token.name = session.name;
      }

      return token;
    },

    async session({ session, token }) {
      // Expose user data in session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.isApproved = token.isApproved as boolean;
      }
      return session;
    },
  },

  // Event handlers for audit logging
  events: {
    async signIn({ user }) {
      // Log successful login to AuditLog
      try {
        await prisma.auditLog.create({
          data: {
            action: 'LOGIN',
            entityType: 'User',
            entityId: user.id,
            userId: user.id,
            metadata: {
              email: user.email,
              timestamp: new Date().toISOString(),
            },
          },
        });
      } catch (error) {
        console.error('Failed to log sign in event:', error);
      }
    },
    async signOut({ token }) {
      // Log logout event
      if (token?.id) {
        try {
          await prisma.auditLog.create({
            data: {
              action: 'LOGOUT',
              entityType: 'User',
              entityId: token.id as string,
              userId: token.id as string,
              metadata: {
                email: token.email,
                timestamp: new Date().toISOString(),
              },
            },
          });
        } catch (error) {
          console.error('Failed to log sign out event:', error);
        }
      }
    },
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
};
