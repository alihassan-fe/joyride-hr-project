import "server-only"
import { neon } from "@neondatabase/serverless"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

// Determine if we're using local PostgreSQL or Neon
const isLocalPostgres = process.env.NODE_ENV === "development" && process.env.USE_LOCAL_DB === "true"

let sql: any

if (isLocalPostgres) {
  // Use standard pg for local development
  const { Pool } = require("pg")
  const pool = new Pool({ connectionString })

  // Create a neon-compatible interface for local PostgreSQL
  sql = async (strings: TemplateStringsArray, ...values: any[]) => {
    let query = strings[0]
    for (let i = 0; i < values.length; i++) {
      query += `$${i + 1}` + strings[i + 1]
    }
    const result = await pool.query(query, values)
    return result.rows
  }
} else {
  // Use Neon for production/staging
  sql = neon(connectionString)
}

export { sql }

// Helper to run parameterized queries without template strings, if needed.
// Example: await query("SELECT 1 as n")
export async function query<T = unknown>(text: string): Promise<T[]> {
  if (isLocalPostgres) {
    const { Pool } = require("pg")
    const pool = new Pool({ connectionString })
    const result = await pool.query(text)
    return result.rows as T[]
  } else {
    // @ts-expect-error neon client is callable as a function with a single string
    const rows = await sql(text)
    return rows as T[]
  }
}
