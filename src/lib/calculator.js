const MINUTES_IN_DAY = 1440

export function formatDuration(totalMinutes, compact = false) {
  const safeMinutes = Math.max(0, Math.round(Number(totalMinutes) || 0))
  const days = Math.floor(safeMinutes / MINUTES_IN_DAY)
  const hours = Math.floor((safeMinutes % MINUTES_IN_DAY) / 60)
  const minutes = safeMinutes % 60
  const parts = []
  if (days) parts.push(`${days}${compact ? 'd' : ` day${days === 1 ? '' : 's'}`}`)
  if (hours) parts.push(`${hours}${compact ? 'h' : ` hour${hours === 1 ? '' : 's'}`}`)
  if (minutes || !parts.length) parts.push(`${minutes}${compact ? 'm' : ` min${minutes === 1 ? '' : 's'}`}`)
  return parts.slice(0, 2).join(compact ? ' ' : ', ')
}

export function getCommitment(totalMinutes) {
  const hours = totalMinutes / 60
  if (hours <= 3) return { rank: 'C', archetype: 'Short session', verdict: 'Comfortably finished in a single sitting.' }
  if (hours <= 8) return { rank: 'B', archetype: 'Day watch', verdict: 'A focused day or a few relaxed evenings.' }
  if (hours <= 20) return { rank: 'A', archetype: 'Weekend binge', verdict: 'A solid weekend-sized commitment.' }
  if (hours <= 45) return { rank: 'S', archetype: 'Multi-week watch', verdict: 'Best planned across several sessions.' }
  if (hours <= 100) return { rank: 'SS', archetype: 'Long haul', verdict: 'A major series commitment worth scheduling.' }
  return { rank: 'SSS', archetype: 'Epic journey', verdict: 'A long-term watch or reading project.' }
}

function isScheduledDay(date, schedule) {
  const day = date.getDay()
  if (schedule === 'weekdays') return day >= 1 && day <= 5
  if (schedule === 'weekends') return day === 0 || day === 6
  return true
}

function calculateFinishDate(activeDays, schedule, now) {
  const finish = new Date(now)
  finish.setHours(12, 0, 0, 0)
  if (!activeDays) return { finish, calendarDays: 0 }

  let completedDays = 0
  let calendarDays = 0
  while (completedDays < activeDays && calendarDays < 10000) {
    if (isScheduledDay(finish, schedule)) completedDays += 1
    if (completedDays < activeDays) finish.setDate(finish.getDate() + 1)
    calendarDays += 1
  }
  return { finish, calendarDays }
}

export function calculateStats(media, settings = {}, now = new Date()) {
  const nativeTotal = media.type === 'ANIME' ? media.episodes : media.chapters
  const total = Math.max(0, Number(settings.customTotal ?? nativeTotal) || 0)
  const completed = Math.min(total, Math.max(0, Number(settings.completed) || 0))
  const remaining = Math.max(0, total - completed)
  const dailyUnits = Math.max(0.25, Number(settings.dailyUnits) || 1)
  const playbackSpeed = Math.max(0.25, Number(settings.playbackSpeed) || 1)
  const schedule = ['daily', 'weekdays', 'weekends'].includes(settings.schedule) ? settings.schedule : 'daily'
  const sourceMinutesPerUnit = media.type === 'ANIME' ? Math.max(1, Number(media.duration) || 24) : Math.max(0.5, Number(settings.readingSpeed) || 4)
  const skippedMinutes = media.type === 'ANIME' && settings.skipExtras ? Math.min(3, Math.max(0, sourceMinutesPerUnit - 1)) : 0
  const minutesPerUnit = (sourceMinutesPerUnit - skippedMinutes) / playbackSpeed
  const totalMinutes = total * minutesPerUnit
  const remainingMinutes = remaining * minutesPerUnit
  const activeDays = remaining === 0 ? 0 : Math.ceil(remaining / dailyUnits)
  const { finish, calendarDays } = calculateFinishDate(activeDays, schedule, now)
  const daysPerWeek = schedule === 'weekdays' ? 5 : schedule === 'weekends' ? 2 : 7
  const commitment = getCommitment(totalMinutes)
  const completionPercent = total ? Math.round((completed / total) * 100) : 0
  const sessions = Math.max(0, Math.ceil(remaining / dailyUnits))
  const commitmentScore = Math.min(100, Math.round(18 + Math.log10(Math.max(1, totalMinutes / 60) + 1) * 39))
  const paceScore = Math.min(100, Math.round((dailyUnits * minutesPerUnit / 180) * 100))
  const speedScore = media.type === 'ANIME'
    ? Math.min(100, Math.round((playbackSpeed / 2) * 100))
    : Math.min(100, Math.round(((7 - Math.min(7, minutesPerUnit)) / 6.5) * 100))
  const consistencyScore = Math.round((daysPerWeek / 7) * 100)
  const bingeIndex = Math.round(commitmentScore * .3 + paceScore * .3 + speedScore * .15 + consistencyScore * .15 + completionPercent * .1)
  const profile = { commitment: commitmentScore, intensity: paceScore, speed: speedScore, consistency: consistencyScore, progress: completionPercent, index: bingeIndex }

  return {
    total,
    completed,
    remaining,
    minutesPerUnit,
    totalMinutes,
    remainingMinutes,
    dailyMinutes: dailyUnits * minutesPerUnit,
    weeklyMinutes: dailyUnits * minutesPerUnit * daysPerWeek,
    weeklyUnits: dailyUnits * daysPerWeek,
    dailyUnits,
    activeDays,
    calendarDays,
    schedule,
    scheduleLabel: schedule === 'weekdays' ? 'Weekdays' : schedule === 'weekends' ? 'Weekends' : 'Every day',
    skippedMinutes,
    savedMinutes: remaining * skippedMinutes / playbackSpeed,
    finishDate: finish,
    finishLabel: total === 0
      ? `Add ${media.type === 'ANIME' ? 'episode' : 'chapter'} total`
      : remaining === 0
        ? 'Already complete'
        : finish.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: finish.getFullYear() !== now.getFullYear() ? 'numeric' : undefined }),
    completionPercent,
    sessions,
    moviesEquivalent: Math.max(0.1, totalMinutes / 120),
    sleepEquivalent: totalMinutes / 480,
    commitment,
    profile,
    isReady: total > 0,
    hasKnownTotal: Boolean(nativeTotal),
  }
}
