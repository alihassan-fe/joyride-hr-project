import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Accepts multipart/form-data with fields: file (pdf), applied_job_id
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 })
  }
  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: "invalid form data" }, { status: 400 })

  const file = formData.get("file") as File | null
  const applied_job_id = String(formData.get("applied_job_id") || "")
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 })

  // Upload to Blob storage
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const uploaded = await put(`cvs/${Date.now()}-${file.name}`, buffer, {
    access: "public",
    contentType: file.type || "application/pdf",
  })

  // Ask the model to extract structured data
  const pdfName = file.name
  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: "You extract structured candidate data from resumes. Respond ONLY in JSON.",
    prompt: `
Parse the following resume. Return JSON with keys:
{name, email, phone, skills: string[], work_history: string[], scores: {overall: number between 0 and 10}, job_title?: string}

Resume filename: ${pdfName}
Resume URL: ${uploaded.url}
`,
  })

  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: "Failed to parse AI output" }, { status: 500 })
  }

  const data = {
    name: parsed.name || "",
    email: parsed.email || "",
    phone: parsed.phone || "",
    cv_url: uploaded.url,
    status: "New",
    scores: parsed.scores || { overall: 0 },
    applied_job_id,
    job_title: parsed.job_title || "",
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    work_history: Array.isArray(parsed.work_history) ? parsed.work_history : [],
  }

  return NextResponse.json({ data })
}
