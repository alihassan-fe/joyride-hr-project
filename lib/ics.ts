type ICSParams = {
  uid: string
  title: string
  description?: string
  location?: string
  organizer?: string
  attendees?: string[]
  startISO: string
  endISO: string
}

function toICSDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(
    d.getUTCMinutes(),
  )}${pad(d.getUTCSeconds())}Z`
}

export function createEventICS(params: ICSParams) {
  const {
    uid,
    title,
    description = "",
    location = "",
    organizer = "hr@company.test",
    attendees = [],
    startISO,
    endISO,
  } = params

  const dtstamp = toICSDate(new Date().toISOString())
  const dtstart = toICSDate(startISO)
  const dtend = toICSDate(endISO)

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Joyride HR//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeText(title)}`,
    description ? `DESCRIPTION:${escapeText(description)}` : undefined,
    location ? `LOCATION:${escapeText(location)}` : undefined,
    `ORGANIZER:mailto:${organizer}`,
    ...attendees.map(
      (a) => `ATTENDEE;CN=${escapeText(a)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${a}`,
    ),
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean) as string[]

  return lines.join("\r\n")
}

function escapeText(s: string) {
  return s.replace(/\\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")
}
