// Presale progress: deterministic from a fixed Beijing start time (same for all users).
// - Before start: 99.46%
// - From 2026-03-28 08:30 Beijing: +0.01% per hour until 99.8%
// - From 99.8% to 99.99%: +0.01% per day
// - At 99.99%: reset to 90.01%, then same rules repeat

// 北京时间 2026/03/28 08:30 = UTC 2026-03-28 00:30
const START_MS = new Date('2026-03-28T00:30:00.000Z').getTime()

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const INITIAL_PROGRESS = 99.46
const THRESHOLD_HOURLY_CAP = 99.8
const THRESHOLD_RESET = 99.99
const AFTER_RESET = 90.01
const STEP = 0.01
const MAX_ITER = 2_000_000

const END_DATE = new Date('2026-03-30T16:00:00.000Z')

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function computeProgressAt(nowMs: number): number {
  if (nowMs < START_MS) return INITIAL_PROGRESS

  let s = { t: START_MS, p: INITIAL_PROGRESS }
  let iter = 0

  while (s.t < nowMs && iter < MAX_ITER) {
    iter += 1
    if (s.p >= THRESHOLD_RESET) {
      s = { t: s.t, p: AFTER_RESET }
      continue
    }
    if (s.p < THRESHOLD_HOURLY_CAP) {
      const nextT = s.t + HOUR_MS
      if (nextT > nowMs) break
      s.p = round2(Math.min(THRESHOLD_HOURLY_CAP, s.p + STEP))
      s.t = nextT
    } else {
      const nextT = s.t + DAY_MS
      if (nextT > nowMs) break
      s.p = round2(Math.min(THRESHOLD_RESET, s.p + STEP))
      s.t = nextT
    }
  }

  return round2(s.p)
}

export function getPresaleProgress(): number {
  const now = typeof window !== 'undefined' ? Date.now() : START_MS
  return computeProgressAt(now)
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
