// Presale: starts 2026/03/18 20:00 Beijing time (UTC+8), +0.01% every 10 min, deadline 2026/03/30
// Base progress 86.25% at start, then +0.01% per 10 min
const START_DATE = new Date('2026-03-18T12:00:00.000Z') // 20:00 Beijing = 12:00 UTC
const END_DATE = new Date('2026-03-30T16:00:00.000Z')   // 2026/03/30 end of day Beijing (UTC+8)
const BASE_PROGRESS = 86.25
const RATE_PER_10MIN = 0.01
const MINUTES_PER_TICK = 10
const MAX_PROGRESS = 100

export function getPresaleProgress(): number {
  const now = new Date()
  if (now < START_DATE) return BASE_PROGRESS
  if (now >= END_DATE) return MAX_PROGRESS
  const elapsedMs = now.getTime() - START_DATE.getTime()
  const elapsedMinutes = elapsedMs / (1000 * 60)
  const ticks = Math.floor(elapsedMinutes / MINUTES_PER_TICK)
  const progress = BASE_PROGRESS + ticks * RATE_PER_10MIN
  return Math.min(progress, MAX_PROGRESS)
}

export function getPresaleDeadline(): Date {
  return END_DATE
}

export function formatDeadline(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
