import "server-only"
import { neon } from "@neondatabase/serverless"

// Create a singleton Neon client. In serverless environments this is lightweight.
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

// Export a tagged-template SQL client: sql`SELECT ...`
export const sql = neon(connectionString)

// Helper to run parameterized queries without template strings, if needed.
// Example: await query("SELECT 1 as n")
export async function query<T = unknown>(text: string): Promise<T[]> {
  // @ts-expect-error neon client is callable as a function with a single string
  const rows = await sql(text)
  return rows as T[]
}
