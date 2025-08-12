// app/actions.ts
"use server"
import { sql } from "@/lib/db"

export async function getData() {
  const data = await sql`SELECT * FROM your_table`
  return data
}
