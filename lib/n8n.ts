import { createHmac } from "crypto"

type TriggerResult = { ok: boolean; status: number; id?: string; error?: string }

export async function triggerN8n(webhookUrl: string, payload: any): Promise<TriggerResult> {
  const body = JSON.stringify(payload)
  const headers: Record<string, string> = { "Content-Type": "application/json" }

  // Optional HMAC signature for verification in n8n
  const secret = process.env.N8N_WEBHOOK_SECRET
  if (secret) {
    const sig = createHmac("sha256", secret).update(body).digest("hex")
    headers["X-Signature-256"] = sig
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body,
  })

  let id: string | undefined
  try {
    const data = await res.json()
    id = data?.id || data?.messageId || data?.executionId
  } catch {
    // ignore non-JSON responses
  }

  return { ok: res.ok, status: res.status, id, error: !res.ok ? res.statusText : undefined }
}
