import { Role } from '@prisma/client';
import { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      email: string;
      name: string;
      laboratoryId?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: Role;
    email: string;
    name: string;
    laboratoryId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    email: string;
    name: string;
    laboratoryId?: string | null;
  }
}
