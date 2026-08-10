import { CalendarDays, Clock3, FastForward, Flag, Gauge, Play, SlidersHorizontal } from 'lucide-react'
import { formatDuration } from '../lib/calculator'

const mangaSpeeds = [
  { value: 2.5, label: 'Fast', detail: '2.5m' },
  { value: 4, label: 'Average', detail: '4m' },
  { value: 6, label: 'Detailed', detail: '6m' },
]
const animeSpeeds = [1, 1.25, 1.5, 2]
const schedules = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
]

export default function Customizer({ media, settings, setSettings, stats }) {
  const unit = media.type === 'ANIME' ? 'episode' : 'chapter'
  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }))
  const max = stats.total || 1
  const applyChallenge = (days, schedule = 'daily') => setSettings((current) => ({
    ...current,
    schedule,
    dailyUnits: Math.max(1, Math.ceil(stats.remaining / days)),
  }))

  return (
    <aside className="customizer panel">
      <div className="planner-heading">
        <span className="step-number">01</span>
        <div><span className="kicker">TUNE THE ROUTINE</span><h3>Plan settings</h3><p>Every change updates your finish date.</p></div>
        <SlidersHorizontal size={20} />
      </div>

      {!stats.hasKnownTotal && (
        <label className="field-block unknown-total">
          <span><strong>Current {unit} count</strong><small>AniList has no total for this ongoing title.</small></span>
          <input type="number" min="1" value={settings.customTotal} onChange={(event) => update('customTotal', event.target.value)} placeholder="Total" />
        </label>
      )}

      <div className="control-block">
        <div className="control-heading">
          <span><Play size={17} /> Current progress</span>
          <label className="progress-number"><span className="sr-only">Completed {unit}s</span><input type="number" min="0" max={stats.total || undefined} value={settings.completed} onChange={(event) => update('completed', Math.max(0, Number(event.target.value)))} /><span>/ {stats.total || '?'}</span></label>
        </div>
        <input aria-label={`Completed ${unit}s`} className="range" type="range" min="0" max={max} step="1" value={Math.min(settings.completed, max)} onChange={(event) => update('completed', Number(event.target.value))} disabled={!stats.total} />
        <div className="range-scale"><span>Not started</span><span>{stats.completionPercent}% complete</span></div>
      </div>

      <div className="control-block">
        <div className="control-heading">
          <span><Gauge size={17} /> {media.type === 'ANIME' ? 'Playback speed' : 'Reading pace'}</span>
          <strong>{formatDuration(stats.minutesPerUnit, true)} / {unit}</strong>
        </div>
        <div className={`segmented ${media.type === 'MANGA' ? 'segmented-wide' : ''}`} role="group" aria-label={media.type === 'ANIME' ? 'Playback speed' : 'Reading pace'}>
          {media.type === 'ANIME' ? animeSpeeds.map((speed) => (
            <button aria-pressed={settings.playbackSpeed === speed} className={settings.playbackSpeed === speed ? 'active' : ''} type="button" key={speed} onClick={() => update('playbackSpeed', speed)}>{speed}×</button>
          )) : mangaSpeeds.map((speed) => (
            <button aria-pressed={settings.readingSpeed === speed.value} className={settings.readingSpeed === speed.value ? 'active' : ''} type="button" key={speed.value} onClick={() => update('readingSpeed', speed.value)}>{speed.label}<small>{speed.detail} / ch</small></button>
          ))}
        </div>
        {media.type === 'ANIME' && (
          <label className="toggle-row">
            <span><FastForward size={17} /><span><strong>Skip openings & endings</strong><small>Saves about 3 minutes per episode</small></span></span>
            <input type="checkbox" checked={settings.skipExtras} onChange={(event) => update('skipExtras', event.target.checked)} />
            <i aria-hidden="true" />
          </label>
        )}
      </div>

      <div className="control-block plan-control">
        <div className="control-heading"><span><CalendarDays size={17} /> Active days</span><strong>{stats.scheduleLabel}</strong></div>
        <div className="segmented schedule-segments" role="group" aria-label="Active days">
          {schedules.map((schedule) => <button aria-pressed={settings.schedule === schedule.value} className={settings.schedule === schedule.value ? 'active' : ''} type="button" key={schedule.value} onClick={() => update('schedule', schedule.value)}>{schedule.label}</button>)}
        </div>
        <div className="units-row">
          <label><span>{unit}s per active day</span><input aria-label={`${unit}s per active day`} type="number" min="1" max="100" value={settings.dailyUnits} onChange={(event) => update('dailyUnits', Math.max(1, Number(event.target.value)))} /></label>
          <div><Clock3 size={17} /><span><small>Session length</small><strong>{formatDuration(stats.dailyMinutes, true)}</strong></span></div>
        </div>
      </div>

      <div className="challenge-presets">
        <span><Flag size={14} /> Quick finish goals</span>
        <div>
          <button type="button" disabled={!stats.isReady} onClick={() => applyChallenge(2, 'weekends')}><strong>Weekend</strong><small>2 active days</small></button>
          <button type="button" disabled={!stats.isReady} onClick={() => applyChallenge(7)}><strong>7 days</strong><small>Daily pace</small></button>
          <button type="button" disabled={!stats.isReady} onClick={() => applyChallenge(30)}><strong>30 days</strong><small>Easy pace</small></button>
        </div>
      </div>

      <div className="plan-summary">
        <div><small>Target finish</small><strong>{stats.finishLabel}</strong></div>
        <div><small>Weekly pace</small><strong>{stats.weeklyUnits} {unit}s</strong></div>
        {stats.savedMinutes > 0 && <p><FastForward size={13} /> You save {formatDuration(stats.savedMinutes)} by skipping openings and endings.</p>}
      </div>
    </aside>
  )
}
