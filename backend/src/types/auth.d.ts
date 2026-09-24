import type { UserRole } from "@prisma/client";

export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}

export interface AuthSession {
  user: AuthUser;
  expires: string;
}
