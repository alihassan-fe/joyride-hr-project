import { NextRequest } from "next/server"
import { getSql } from "@/lib/sql"
import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response("OPENAI_API_KEY not set", { status: 500 })
  }
  const body = await req.json().catch(() => null) as { messages?: { role: string; content: string }[] } | null
  const userMessage = body?.messages?.filter(m => m.role === "user").slice(-1)[0]?.content || ""

  const sql = getSql()
  const candidates = await sql/* sql */`
    SELECT name, status, COALESCE(scores->>'overall','0') AS overall, COALESCE(job_title,'') AS job_title, COALESCE(applied_job_id,'') AS applied_job_id, COALESCE(skills,'[]'::jsonb) AS skills
    FROM candidates
    ORDER BY created_at DESC
    LIMIT 200
  `
  const employees = await sql/* sql */`
    SELECT name, role, pto_balance FROM employees ORDER BY name ASC LIMIT 200
  `

  const cText = candidates.map((c: any) => `- ${c.name} | score ${c.overall} | status ${c.status} | job ${c.job_title || c.applied_job_id} | skills ${(Array.isArray(c.skills) ? c.skills : []).join(", ")}`).join("\n")
  const eText = employees.map((e: any) => `- ${e.name} | role ${e.role} | PTO ${e.pto_balance}`).join("\n")

  const result = await streamText({
    model: openai("gpt-4o"),
    system: "You are an HR assistant. Use the provided data context to answer succinctly.",
    prompt: `Context:
Candidates:
${cText || "(none)"}

Employees:
${eText || "(none)"}

Question: ${userMessage}
Answer based only on the context above.`,
  })
  return result.toAIStreamResponse()
}
