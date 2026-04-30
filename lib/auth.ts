import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import db from "@/db/index";
import { users } from "@/db/schema";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          salonId: user.salonId,
          role: user.role,
          fullName: user.fullName,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only defined at sign-in
      if (user) {
        token.id = (user as any).id;
        token.salonId = (user as any).salonId;
        token.role = (user as any).role;
        token.fullName = (user as any).fullName;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = token.id;
      (session.user as any).salonId = token.salonId;
      (session.user as any).role = token.role;
      (session.user as any).fullName = token.fullName;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
};

export default NextAuth(authOptions);