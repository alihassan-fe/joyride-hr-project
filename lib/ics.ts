type ICSOptions = {
  uid: string
  title: string
  description?: string
  location?: string
  startISO: string
  endISO: string
  organizer: string
  attendees: string[]
}

function isoToCal(iso: string) {
  // Always UTC Z format without milliseconds
  const z = new Date(iso).toISOString().replace(/\.\d{3}Z$/, "Z")
  return z.replace(/[-:]/g, "").replace(".000", "")
}

export function createEventICS(opts: ICSOptions) {
  const dtStart = isoToCal(opts.startISO)
  const dtEnd = isoToCal(opts.endISO)
  const lines = [
    "BEGIN:VCALENDAR",
    "PRODID:-//Joyride HR//Calendar//EN",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    `DTSTAMP:${isoToCal(new Date().toISOString())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeText(opts.title)}`,
    opts.location ? `LOCATION:${escapeText(opts.location)}` : undefined,
    opts.description ? `DESCRIPTION:${escapeText(opts.description)}` : undefined,
    `ORGANIZER:${escapeText(opts.organizer)}`,
    ...opts.attendees.map((a) => `ATTENDEE;CN=${escapeText(a)}:MAILTO:${escapeText(a)}`),
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean) as string[]
  return lines.join("\r\n")
}

function escapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")
}
