import { NextRequest, NextResponse } from "next/server"

// Mock "parser" for PDFs, since we don't access OpenAI here.
// Accepts multipart/form-data with fields: file (pdf), applied_job_id
export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: "invalid form data" }, { status: 400 })
  const file = formData.get("file") as File | null
  const jobId = String(formData.get("applied_job_id") || "")
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 })
  const fileName = file.name || "resume.pdf"
  // Heuristic fake parse
  const baseName = fileName.replace(/\.[^/.]+$/, "")
  const name = baseName.replace(/[_\-]/g, " ").split(" ").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ") || "Unknown Candidate"
  const skills = ["JavaScript","React","SQL","Node.js","Tailwind"].sort(() => 0.5 - Math.random()).slice(0, 3)
  const work = [
    "Software Engineer at Example Corp (2021-2024)",
    "Frontend Developer at Web Inc (2019-2021)",
    "Intern at Dev LLC (2018-2019)"
  ].sort(() => 0.5 - Math.random()).slice(0, 2)
  const data = {
    name,
    email: `${baseName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    phone: "+1 555-0100",
    cv_url: "",
    status: "New",
    scores: { overall: 6 + Math.floor(Math.random()*4) },
    applied_job_id: jobId,
    job_title: "",
    skills,
    work_history: work
  }
  return NextResponse.json({ data })
}
