import Credentials from "@auth/express/providers/credentials";
import { authenticateDummyUser } from "./dummyUsers";

export const authConfig = {
  secret: process.env.AUTH_SECRET || "rentify_super_secret_auth_key_2026",
  trustHost: true,
  session: {
    strategy: "jwt" as const,
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@rentify.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Memverifikasi menggunakan data dummy terlebih dahulu
        const user = await authenticateDummyUser(email, password);

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
