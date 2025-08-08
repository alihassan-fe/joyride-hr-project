import NextAuth, { type NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import AzureAD from "next-auth/providers/azure-ad"
import Credentials from "next-auth/providers/credentials"
import { getSql } from "@/lib/sql"
import bcrypt from "bcryptjs"

export const authConfig = {
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  providers: [
    // Manual email + password login
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email?.toString().trim().toLowerCase()
        const password = credentials?.password?.toString() || ""
        if (!email || !password) return null

        const sql = getSql()
        const rows = await sql/* sql */`
          SELECT id, email, name, role, password_hash
          FROM users
          WHERE email = ${email}
          LIMIT 1
        `
        if (rows.length === 0) return null
        const user = rows[0] as { id: string; email: string; name: string | null; role: string | null; password_hash: string }

        const ok = await bcrypt.compare(password, user.password_hash)
        if (!ok) return null

        return {
          id: user.id,
          name: user.name ?? "",
          email: user.email,
          role: user.role ?? "Viewer",
        } as any
      },
    }),
    // SSO providers (keep existing)
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    AzureAD({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID || "common",
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // When logging in via any provider, copy role if present
      if (user && (user as any).role) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        ;(session.user as any).id = token.sub
        ;(session.user as any).role = (token as any).role || "Authenticated"
      }
      return session
    },
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
