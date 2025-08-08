import { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { streamText, generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { messages?: { role: string; content: string }[] } | null
  const userMessage = body?.messages?.filter(m => m.role === "user").slice(-1)[0]?.content || ""

  // If no API key, run a deterministic on-device heuristic over in-memory DB
  if (!process.env.OPENAI_API_KEY) {
    const txt = localHeuristicAnswer(userMessage)
    return new Response(txt, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    })
  }

  // Use AI SDK to stream text from OpenAI
  const result = await streamText({
    model: openai("gpt-4o"),
    system: "You are an HR assistant. Use the provided data context to answer succinctly.",
    prompt: buildContextPrompt(userMessage),
  })
  return result.toAIStreamResponse()
}

function buildContextPrompt(question: string) {
  const candidates = db.candidates.list()
  const employees = db.employees.list()
  const cText = candidates.map(c => `- ${c.name} | score ${c.scores?.overall ?? "-"} | status ${c.status} | job ${c.job_title || c.applied_job_id || "-"} | skills ${(c.skills||[]).join(", ")}`).join("\n")
  const eText = employees.map(e => `- ${e.name} | role ${e.role} | PTO ${e.pto_balance}`).join("\n")
  return `Context:
Candidates:
${cText || "(none)"}

Employees:
${eText || "(none)"}

Question: ${question}
Answer based only on the context above.`
}

function localHeuristicAnswer(q: string): string {
  const candidates = db.candidates.list()
  const employees = db.employees.list()
  const lower = q.toLowerCase()

  // score filter
  const scoreMatch = lower.match(/score (?:above|over|greater than)\s*(\d+)/)
  if (scoreMatch) {
    const min = parseInt(scoreMatch[1], 10)
    const list = candidates.filter(c => (c.scores?.overall ?? 0) > min)
      .map(c => `${c.name} (score ${c.scores?.overall})`)
    return list.length ? `Candidates with score > ${min}: ${list.join(", ")}` : `No candidates above score ${min}.`
  }

  // PTO for person
  const ptoMatch = lower.match(/when.*(pto|vacation).*([a-z]+)\s?([a-z]*)/i)
  if (ptoMatch) {
    const name = (q.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/) || [""])[0]
    const e = employees.find(e => e.name.toLowerCase().includes(name.toLowerCase()))
    if (e) return `${e.name} has ${e.pto_balance} days PTO remaining.`
    return `I couldn't find ${name} in employees.`
  }

  // employees in department (simple contains)
  const deptMatch = lower.match(/employees in ([a-z\s]+)/)
  if (deptMatch) {
    const dept = deptMatch[1].trim()
    const list = employees.filter(e => e.role.toLowerCase().includes(dept)).map(e => e.name)
    return list.length ? `Employees in ${dept}: ${list.join(", ")}` : `No employees found in ${dept}.`
  }

  // fallback
  const top = candidates.slice(0, 5).map(c => `${c.name} (${c.status}, score ${c.scores?.overall ?? "-"})`).join(", ")
  return `I couldn't fully parse that. Here are recent candidates: ${top || "none"}.`
}
