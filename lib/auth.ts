import { jwtVerify } from "jose";
import prisma from "./prisma";
import crypto from 'crypto';
import { NextAuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';

// Extend the built-in session types
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      role: string;
      organizationId: string;
    } & DefaultSession["user"]
  }

  interface User {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  }
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  organizationId?: string;
  isOwner?: boolean;
  permissions?: string[];
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  settings?: Record<string, any>;
}

interface AuthResult {
  user: User;
  organization: Organization;
}

/**
 * Lightweight JWT verification for middleware (Edge compatible)
 * Does NOT fetch from database - only verifies the token's validity and structure
 * Use this in middleware or edge functions where Prisma cannot be used
 * 
 * @param token - JWT token to verify
 * @returns Simple verification result with minimal user/org data from the token
 */
export async function verifyAuthForEdge(token: string): Promise<{ 
  valid: boolean; 
  userId?: string;
  organizationId?: string;
  role?: string;
}> {
  try {
    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    
    // Extract basic user info from token payload
    const userId = (payload.user && (payload.user as any).id) || payload.userId as string;
    const organizationId = (payload.organization && (payload.organization as any).id) || payload.organizationId as string;
    const role = (payload.user && (payload.user as any).role) || payload.role as string;
    
    if (!userId) {
      return { valid: false };
    }
    
    return {
      valid: true,
      userId,
      organizationId,
      role
    };
  } catch (error) {
    console.error("Edge auth verification error:", error);
    return { valid: false };
  }
}

/**
 * Verifies the JWT token and returns fresh user and organization data
 * Always fetches the latest data from the database to ensure permissions and details are up-to-date
 * Only use this in server components/routes, NOT in middleware or Edge functions
 * 
 * @param token - JWT token to verify
 * @returns AuthResult containing fresh user and organization data
 */
export async function verifyAuth(token: string): Promise<AuthResult> {
  try {
    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    
    // Extract user ID from payload - either from userId field or user.id
    const userId = (payload.user && (payload.user as any).id) || payload.userId as string;
    
    if (!userId) {
      throw new Error("Invalid token: missing user identifier");
    }
    
    // Always fetch fresh user data from the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        permissions: true,
      },
    });
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Always fetch fresh organization data
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });
    
    if (!organization) {
      throw new Error("Organization not found");
    }
    
    // Return clean user object with mapped permissions
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        role: user.role,
        organizationId: user.organizationId,
        isOwner: user.isOwner,
        permissions: user.permissions.map(p => p.name),
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        settings: organization.settings as Record<string, any> || {},
      }
    };
  } catch (error) {
    console.error("Auth verification error:", error);
    throw new Error("Authentication failed");
  }
}

export function getJwtSecretKey(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT Secret key is not set in environment variables')
  }
  return secret
}

export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export const authOptions: NextAuthOptions = {
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

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email,
          },
          include: {
            organization: true,
          },
        });

        if (!user) {
          throw new Error('User not found');
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};