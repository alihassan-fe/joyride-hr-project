type EmailRenderParams = {
  title: string
  type: string
  description?: string
  location?: string
  startISO: string
  endISO: string
  videoLink?: string
  message?: string
}

export function renderEventEmailHTML(p: EmailRenderParams) {
  const start = new Date(p.startISO)
  const end = new Date(p.endISO)
  const fmt = (d: Date) =>
    `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`

  const subtitle = p.type === "interview" ? "Interview Invitation" : p.type === "pto" ? "Time Off" : "Event Invitation"

  const details = [
    `<tr><td style="padding:4px 0"><strong>When:</strong> ${fmt(start)} - ${fmt(end)}</td></tr>`,
    p.location ? `<tr><td style="padding:4px 0"><strong>Where:</strong> ${escapeHtml(p.location)}</td></tr>` : "",
    p.videoLink
      ? `<tr><td style="padding:4px 0"><strong>Link:</strong> <a href="${p.videoLink}">${p.videoLink}</a></td></tr>`
      : "",
  ]
    .filter(Boolean)
    .join("")

  return `
  <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;padding:24px">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb">
          <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.08em">${subtitle}</div>
          <div style="font-size:20px;font-weight:600;color:#0f172a;margin-top:4px">${escapeHtml(p.title)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px">
          <table width="100%" cellspacing="0" cellpadding="0">
            ${details}
          </table>
          ${p.description ? `<p style="margin-top:8px;color:#334155;white-space:pre-wrap">${escapeHtml(p.description)}</p>` : ""}
          ${p.message ? `<p style="margin-top:8px;color:#334155;white-space:pre-wrap">${escapeHtml(p.message)}</p>` : ""}
        </td>
      </tr>
      <tr>
        <td style="padding:12px 24px;border-top:1px solid #e5e7eb;color:#94a3b8;font-size:12px">
          Sent by Joyride HR Calendar
        </td>
      </tr>
    </table>
  </div>`
}

function escapeHtml(s?: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
