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
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  return `
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI;max-width:640px;margin:auto;padding:24px">
    <h2 style="margin:0 0 8px">${escapeHtml(p.type.toUpperCase())}: ${escapeHtml(p.title)}</h2>
    <p style="margin:0 0 8px;color:#475569">${fmt(p.startISO)} - ${fmt(p.endISO)}</p>
    ${p.location ? `<p style="margin:0 0 8px"><strong>Location:</strong> ${escapeHtml(p.location)}</p>` : ""}
    ${
      p.videoLink
        ? `<p style="margin:0 0 8px"><strong>Video:</strong> <a href="${escapeAttr(
            p.videoLink,
          )}">${escapeHtml(p.videoLink)}</a></p>`
        : ""
    }
    ${p.description ? `<p style="white-space:pre-line">${escapeHtml(p.description)}</p>` : ""}
    ${
      p.message
        ? `<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0" />
      <p style="white-space:pre-line">${escapeHtml(p.message)}</p>`
        : ""
    }
  </div>`
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}
function escapeAttr(s: string) {
  return s.replace(/"/g, "&quot;")
}