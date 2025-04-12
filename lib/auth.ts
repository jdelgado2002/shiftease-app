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
    
    if (!payload.user || !payload.organization) {
      throw new Error("Invalid token payload");
    }

    return {
      user: payload.user as User,
      organization: payload.organization as Organization
    };
  } catch (error) {
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