import { neon } from "@neondatabase/serverless"

let _sql: any = null

export function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error("DATABASE_URL is not set")
    }

    const isLocalPostgres = process.env.NODE_ENV === "development" && process.env.USE_LOCAL_DB === "true"

    if (isLocalPostgres) {
      // Use standard pg for local development
      const { Pool } = require("pg")
      const pool = new Pool({ connectionString: url })

      // Create a neon-compatible interface
      _sql = async (strings: TemplateStringsArray, ...values: any[]) => {
        let query = strings[0]
        for (let i = 0; i < values.length; i++) {
          query += `$${i + 1}` + strings[i + 1]
        }
        const result = await pool.query(query, values)
        return result.rows
      }
    } else {
      // Use Neon for production/staging
      _sql = neon(url)
    }
  }
  return _sql
}

export const sql = getSql()
