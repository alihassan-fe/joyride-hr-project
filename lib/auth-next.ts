import NextAuth, { type NextAuthOptions } from "next-auth"
import { getServerSession } from "next-auth"
import Google from "next-auth/providers/google"
import AzureAD from "next-auth/providers/azure-ad"
import Credentials from "next-auth/providers/credentials"
import { getSql } from "@/lib/sql"

export const authOptions: NextAuthOptions = {
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
          SELECT id, email, name, role
          FROM users
          WHERE email = ${email}
            AND password_hash = crypt(${password}, password_hash)
          LIMIT 1
        `
        
        // Handle the SQL result properly
        const userRows = Array.isArray(rows) ? rows : []
        if (userRows.length === 0) return null
        
        const user = userRows[0] as { id: string; email: string; name: string | null; role: string | null }

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

// Export getServerSession for use in server components
export const auth = async () => {
  return await getServerSession(authOptions)
}
