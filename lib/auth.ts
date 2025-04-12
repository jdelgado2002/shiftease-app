import { jwtVerify } from "jose";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface AuthResult {
  user: User;
  organization: Organization;
}

export async function verifyAuth(token: string): Promise<AuthResult> {
  try {
    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    
    // Handle different token structures
    // Some tokens might have user/org directly in payload, others might have userId/organizationId
    if (payload.user && payload.organization) {
      return {
        user: payload.user as User,
        organization: payload.organization as Organization
      };
    } else if (payload.userId && payload.organizationId) {
      // Legacy format - we should fetch the user and org from the database
      // For this quick fix we'll return what we have, but in production
      // you would want to fetch the complete user and org data
      return {
        user: {
          id: payload.userId as string,
          email: payload.email as string || '',
          role: payload.role as string || '',
        } as User,
        organization: {
          id: payload.organizationId as string,
          name: '',
          slug: '',
        } as Organization
      };
    }
    
    throw new Error("Invalid token payload");
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