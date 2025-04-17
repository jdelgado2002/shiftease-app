import { compare } from "bcryptjs"
import { Prisma, PrismaClient, Role } from "@prisma/client"
import { DefaultSession, NextAuthOptions, getServerSession } from "next-auth"
import { DefaultUser } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "./prisma"
import { jwtVerify } from "jose";
import crypto from 'crypto';

// Define base types that extend NextAuth's defaults
interface BaseUser extends DefaultUser {
  id: string
  email: string
  name: string
  firstName?: string | null
  lastName?: string | null
  role: Role
  organizationId: string
  isOwner: boolean
  permissions: string[]
  organization: {
    id: string
    name: string
    slug: string
    settings?: Record<string, any>
  }
}

export type ExtendedUser = BaseUser & {
  image?: string | null
  emailVerified?: Date | null
}

declare module "next-auth" {
  interface Session {
    user: BaseUser & DefaultSession["user"]
  }

  interface User extends BaseUser {}
}

declare module "next-auth/jwt" {
  interface JWT extends Omit<BaseUser, "emailVerified" | "image"> {
    picture?: string | null
    email_verified?: Date | null
  }
}

type PrismaUser = Prisma.UserGetPayload<{
  include: {
    organization: true;
    permissions: true;
  };
}>;

interface Organization {
  id: string;
  name: string;
  slug: string;
  settings?: Record<string, any>;
}

interface AuthResult {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    organizationId: string;
    isOwner?: boolean;
    permissions?: string[];
    organization?: Organization;
  };
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
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          settings: organization.settings as Record<string, any> || {},
        },
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
  adapter: {
    ...PrismaAdapter(prisma),
    getUser: async (id: string) => {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          organization: true,
          permissions: true,
        },
      });
      
      if (!user) return null;
      
      // Create a new object with the required fields
      const nextAuthUser = {
        id: user.id,
        email: user.email,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        isOwner: user.isOwner,
        permissions: user.permissions.map(p => p.name),
        organization: user.organization ? {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
          settings: user.organization.settings as Record<string, any> | undefined,
        } : undefined,
      } as const;
      
      return nextAuthUser as any;
    },
  } as any,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        organizationSlug: { label: "Organization Slug", type: "text", optional: true },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials")
        }

        // Find user by email first
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email,
            status: "ACTIVE",
          },
          include: {
            organization: true,
            permissions: true,
          },
        })

        if (!user || !user.password) {
          throw new Error("User not found")
        }

        const isValidPassword = await compare(credentials.password, user.password)
        if (!isValidPassword) {
          throw new Error("Invalid password")
        }

        if (!user.organization) {
          throw new Error("User is not associated with any organization")
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
          isOwner: user.isOwner,
          permissions: user.permissions.map((p) => p.name),
          organization: {
            id: user.organization.id,
            name: user.organization.name,
            slug: user.organization.slug,
            settings: user.organization.settings as Record<string, any> | undefined,
          },
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          organizationId: user.organizationId,
          isOwner: user.isOwner,
          permissions: user.permissions,
          organization: user.organization,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
        }
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
          organizationId: token.organizationId,
          isOwner: token.isOwner,
          permissions: token.permissions,
          organization: token.organization,
          firstName: token.firstName,
          lastName: token.lastName,
          name: token.name,
        },
      }
    },
  },
  events: {
    async signIn({ user }) {
      // Update last login time or handle other events
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() },
      })
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
}