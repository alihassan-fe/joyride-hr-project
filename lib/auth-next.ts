import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AzureADProvider from "next-auth/providers/azure-ad"
import CredentialsProvider from "next-auth/providers/credentials"
import { getSql } from "@/lib/sql"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  providers: [
    // Manual email + password login
    CredentialsProvider({
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
        ` as any[]
        
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID || "common",
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      // When logging in via any provider, copy role if present
      if (user && (user as any).role) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session?.user) {
        ;(session.user as any).id = token.sub
        ;(session.user as any).role = (token as any).role || "Authenticated"
      }
      return session
    },
  },
}

export default NextAuth(authOptions)
