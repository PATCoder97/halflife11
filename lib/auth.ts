import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { OAuth2Client } from "google-auth-library";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";

export function getAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email?: string | null) {
  return Boolean(email && getAdminEmails().has(email.toLowerCase()));
}

const googleVerifier = new OAuth2Client();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      id: "google-one-tap",
      name: "Google One Tap",
      credentials: {
        credential: { label: "Google ID token", type: "text" },
      },
      async authorize(credentials) {
        const idToken = credentials?.credential;
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!idToken || !clientId) return null;

        try {
          const ticket = await googleVerifier.verifyIdToken({
            idToken,
            audience: clientId,
          });
          const payload = ticket.getPayload();

          if (
            !payload?.sub ||
            !payload.email ||
            payload.email_verified !== true ||
            !isAdminEmail(payload.email)
          ) {
            return null;
          }

          return {
            id: payload.sub,
            email: payload.email,
            name: payload.name ?? payload.email,
            image: payload.picture,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return isAdminEmail(user.email);
    },
  },
  pages: { signIn: "/login" },
};
