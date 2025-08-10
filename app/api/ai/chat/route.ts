import { NextRequest } from "next/server";
import { getSql } from "@/lib/sql";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => null)) as {
      messages?: { role: string; content: string }[];
    } | null;

    const userMessage =
      body?.messages?.filter((m) => m.role === "user").slice(-1)[0]?.content ||
      "";

    let candidates: any[] = [];
    try {
      const sql = getSql();
      candidates = await sql/* sql */ `
        SELECT 
          name, 
          status, 
          COALESCE(scores->>'overall','0') AS overall, 
          COALESCE(job_title,'') AS job_title, 
          COALESCE(applied_job_id,'') AS applied_job_id, 
          COALESCE(skills,'[]'::jsonb) AS skills
        FROM candidates
        ORDER BY created_at DESC
        LIMIT 200
      `;
    } catch (dbErr) {
      console.error("DB error in /api/ai/chat:", dbErr);
      // Fallback to empty list if DB not available
    }

    const cText = (candidates || [])
      .map(
        (c: any) =>
          `- ${c.name} | score ${c.overall} | status ${c.status} | job ${
            c.job_title || c.applied_job_id
          } | skills ${(Array.isArray(c.skills) ? c.skills : []).join(", ")}`
      )
      .join("\n");

    const modelName = process.env.OPENAI_MODEL || "gpt-5";

    const result = await streamText({
      model: openai(modelName),
      system:
        "You are an HR assistant. Use the provided data context to answer succinctly.",
      prompt: `Context:
Candidates:
${cText || "(none)"}

Question: ${userMessage}
Answer based only on the context above.`,
    });

    return result.toAIStreamResponse();
  } catch (err: any) {
    const status = err?.status ?? 500;
    const message = err?.message || "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
