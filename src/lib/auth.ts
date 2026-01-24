import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { logAuthEvent } from '@/lib/audit';
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
          throw new Error('Credenciales faltantes');
        }

        const { email, password } = credentials;

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) {
          throw new Error('Correo electrónico o contraseña inválidos');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
          throw new Error('Correo electrónico o contraseña inválidos');
        }

        // Determine laboratoryId based on role
        let laboratoryId = null;

        if (user.role === 'LAB_ADMIN') {
          laboratoryId = user.laboratoryId;
        } else if (user.role === 'LAB_COLLABORATOR') {
          laboratoryId = user.labCollaboratorId;
        } else if (user.role === 'DOCTOR') {
          laboratoryId = user.doctorLaboratoryId;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          laboratoryId,
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
        token.laboratoryId = user.laboratoryId;
      }

      // Handle profile updates - fetch fresh data from database
      if (trigger === 'update') {
        const updatedUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, email: true },
        });

        if (updatedUser) {
          token.name = updatedUser.name;
          token.email = updatedUser.email;
        }
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
        session.user.laboratoryId = token.laboratoryId as string | null | undefined;
      }
      return session;
    },
  },

  // Event handlers for audit logging
  events: {
    async signIn({ user }) {
      // Log successful login to AuditLog
      await logAuthEvent('LOGIN', user.id, user.email || '', {
        metadata: {
          name: user.name,
        },
      });
    },
    async signOut({ token }) {
      // Log logout event
      if (token?.id) {
        await logAuthEvent('LOGOUT', token.id as string, token.email as string, {
          metadata: {
            name: token.name,
          },
        });
      }
    },
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
};
