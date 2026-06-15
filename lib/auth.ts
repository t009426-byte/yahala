import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { prisma } from "./prisma";
import { verifyOTP } from "./otp";

const credentialsSchema = z.object({
  phone: z.string().min(8).max(15),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Credentials provider requires JWT strategy
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { phone, otp } = parsed.data;
        const valid = await verifyOTP(phone, otp);
        if (!valid) return null;

        // Find or create the user by phone number
        const user = await prisma.user.upsert({
          where: { phone },
          create: { phone, role: "GATE_STAFF" },
          update: {}, // don't overwrite existing role on re-login
        });

        return {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email ?? undefined,
          phone: user.phone ?? undefined,
          role: user.role,
          eventId: user.eventId ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // `user` is only set on initial sign-in
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
        token.role = user.role;
        token.eventId = user.eventId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.phone = token.phone as string | undefined;
      session.user.role = token.role as string as import("@/types").UserRole;
      session.user.eventId = token.eventId as string | undefined;
      return session;
    },
  },
});
